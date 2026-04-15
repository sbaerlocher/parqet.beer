import { describe, it, expect, vi } from 'vitest';
import { getCached } from '../src/lib/server/kv-cache';

/**
 * Minimal in-memory KV fake matching the subset of KVNamespace we use.
 */
function createFakeKv(): KVNamespace & { _store: Map<string, string> } {
  const store = new Map<string, string>();

  return {
    _store: store,
    get: vi.fn(async (key: string, type?: string) => {
      const raw = store.get(key);
      if (raw === undefined) return null;
      return type === 'json' ? JSON.parse(raw) : raw;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async () => ({ keys: [], list_complete: true })),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace & { _store: Map<string, string> };
}

describe('getCached', () => {
  it('calls the fetcher on cache miss and stores the result', async () => {
    const kv = createFakeKv();
    const fetcher = vi.fn().mockResolvedValue({ total: 42 });

    const result = await getCached(kv, 'key', 60, fetcher);

    expect(result).toEqual({ total: 42 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(kv.put).toHaveBeenCalledTimes(1);
    // TTL safety margin: KV expirationTtl should be 2x requested.
    expect(kv.put).toHaveBeenCalledWith(
      'key',
      expect.any(String),
      expect.objectContaining({ expirationTtl: 120 })
    );
  });

  it('returns cached value without calling the fetcher on hit', async () => {
    const kv = createFakeKv();
    kv._store.set('key', JSON.stringify({ data: { total: 99 }, fetchedAt: Date.now() }));
    const fetcher = vi.fn().mockResolvedValue({ total: 1 });

    const result = await getCached(kv, 'key', 60, fetcher);

    expect(result).toEqual({ total: 99 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refetches when the cached entry is older than ttlSeconds', async () => {
    const kv = createFakeKv();
    kv._store.set(
      'key',
      JSON.stringify({
        data: { total: 99 },
        fetchedAt: Date.now() - 61_000, // 61s ago, TTL is 60s
      })
    );
    const fetcher = vi.fn().mockResolvedValue({ total: 123 });

    const result = await getCached(kv, 'key', 60, fetcher);

    expect(result).toEqual({ total: 123 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not cache null results so transient failures do not poison the cache', async () => {
    const kv = createFakeKv();
    const fetcher = vi.fn().mockResolvedValue(null);

    const result = await getCached(kv, 'key', 60, fetcher);

    expect(result).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(kv.put).not.toHaveBeenCalled();
    expect(kv._store.has('key')).toBe(false);
  });

  it('does not cache undefined results', async () => {
    const kv = createFakeKv();
    const fetcher = vi.fn().mockResolvedValue(undefined);

    await getCached(kv, 'key', 60, fetcher);

    expect(kv.put).not.toHaveBeenCalled();
  });
});
