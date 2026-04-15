import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit } from '../src/lib/server/rate-limit';

function createFakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async () => ({ keys: [], list_complete: true })),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request and decrements remaining', async () => {
    const kv = createFakeKv();
    const result = await rateLimit(kv, {
      limit: 3,
      windowSeconds: 60,
      identifier: 'user-1',
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests after the limit is reached', async () => {
    const kv = createFakeKv();
    for (let i = 0; i < 3; i++) {
      await rateLimit(kv, { limit: 3, windowSeconds: 60, identifier: 'user-1' });
    }
    const result = await rateLimit(kv, {
      limit: 3,
      windowSeconds: 60,
      identifier: 'user-1',
    });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks counters per identifier independently', async () => {
    const kv = createFakeKv();
    await rateLimit(kv, { limit: 1, windowSeconds: 60, identifier: 'user-a' });
    const resultA = await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-a',
    });
    const resultB = await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-b',
    });
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it('resets the counter in a new window', async () => {
    const kv = createFakeKv();
    await rateLimit(kv, { limit: 1, windowSeconds: 60, identifier: 'user-1' });
    let result = await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-1',
    });
    expect(result.allowed).toBe(false);

    // Advance past the window.
    vi.advanceTimersByTime(61_000);
    result = await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-1',
    });
    expect(result.allowed).toBe(true);
  });

  it('isolates buckets from each other', async () => {
    const kv = createFakeKv();
    await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-1',
      bucket: 'api',
    });
    const result = await rateLimit(kv, {
      limit: 1,
      windowSeconds: 60,
      identifier: 'user-1',
      bucket: 'auth',
    });
    expect(result.allowed).toBe(true);
  });
});
