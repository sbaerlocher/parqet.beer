import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FX_FALLBACK, isUsableRates, SUPPORTED_CURRENCIES } from '../src/lib/fx';
import { fetchRates, getRates, FX_CACHE_KEY, FX_MAX_AGE_MS } from '../src/lib/server/fx-service';

/** Minimal in-memory KV fake matching the subset of KVNamespace fx-service uses. */
function createFakeKv() {
  const store = new Map<string, string>();
  const kv = {
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
  return kv;
}

function frankfurterBody(rates: Record<string, number>) {
  return { base: 'EUR', date: '2026-07-28', rates };
}

const LIVE = { EUR: 1, CHF: 0.92, USD: 1.08, GBP: 0.85 };

describe('FX_FALLBACK', () => {
  it('is EUR-based and keeps the historical CHF rate', () => {
    expect(FX_FALLBACK.EUR).toBe(1);
    expect(FX_FALLBACK.CHF).toBe(0.95);
  });

  it('covers every supported currency', () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(FX_FALLBACK[code]).toBeGreaterThan(0);
    }
  });
});

describe('isUsableRates', () => {
  it('accepts a complete set of positive finite rates', () => {
    expect(isUsableRates(LIVE)).toBe(true);
  });

  it('rejects a missing currency', () => {
    expect(isUsableRates({ EUR: 1, CHF: 0.92, USD: 1.08 })).toBe(false);
  });

  it('rejects non-positive rates', () => {
    expect(isUsableRates({ ...LIVE, GBP: 0 })).toBe(false);
    expect(isUsableRates({ ...LIVE, USD: -1 })).toBe(false);
  });

  it('rejects non-finite rates', () => {
    expect(isUsableRates({ ...LIVE, USD: Infinity })).toBe(false);
    expect(isUsableRates({ ...LIVE, CHF: NaN })).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isUsableRates(null)).toBe(false);
    expect(isUsableRates('nope')).toBe(false);
  });
});

describe('fetchRates', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns EUR-based rates including EUR itself', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
      )
    );

    await expect(fetchRates()).resolves.toEqual(LIVE);
  });

  it('requests only the supported currencies from the ECB endpoint', async () => {
    const fetchMock = vi.fn(
      async (..._args: unknown[]) =>
        new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchRates();

    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('frankfurter');
    expect(url).toContain('CHF');
    expect(url).toContain('USD');
    expect(url).toContain('GBP');
  });

  it('returns null on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    );

    await expect(fetchRates()).resolves.toBeNull();
  });

  it('returns null when the network throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );

    await expect(fetchRates()).resolves.toBeNull();
  });

  it('returns null when the payload does not match the schema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ oops: true })))
    );

    await expect(fetchRates()).resolves.toBeNull();
  });

  it('returns null when a currency is missing from the payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08 }))))
    );

    await expect(fetchRates()).resolves.toBeNull();
  });

  it('returns null when a rate is zero or negative', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify(frankfurterBody({ CHF: 0, USD: 1.08, GBP: 0.85 })))
      )
    );

    await expect(fetchRates()).resolves.toBeNull();
  });
});

describe('getRates', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a fresh cache entry without fetching', async () => {
    const kv = createFakeKv();
    kv._store.set(FX_CACHE_KEY, JSON.stringify({ rates: LIVE, fetchedAt: Date.now() }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      LIVE
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and stores when the cache is empty', async () => {
    const kv = createFakeKv();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
      )
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      LIVE
    );
    expect(JSON.parse(kv._store.get(FX_CACHE_KEY)!).rates).toEqual(LIVE);
  });

  it('refetches when the cache entry is older than the freshness window', async () => {
    const kv = createFakeKv();
    const stale = { EUR: 1, CHF: 0.9, USD: 1, GBP: 0.8 };
    kv._store.set(
      FX_CACHE_KEY,
      JSON.stringify({ rates: stale, fetchedAt: Date.now() - FX_MAX_AGE_MS - 1000 })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
      )
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      LIVE
    );
  });

  it('never sets an expirationTtl, so the stale entry survives a long outage', async () => {
    const kv = createFakeKv();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
      )
    );

    await getRates({ PARQET_KV: kv } as unknown as App.Platform['env']);

    expect(kv.put).toHaveBeenCalledWith(FX_CACHE_KEY, expect.any(String));
  });

  it('falls back to a stale cache entry when the fetch fails', async () => {
    const kv = createFakeKv();
    const stale = { EUR: 1, CHF: 0.9, USD: 1, GBP: 0.8 };
    kv._store.set(
      FX_CACHE_KEY,
      JSON.stringify({ rates: stale, fetchedAt: Date.now() - FX_MAX_AGE_MS - 1000 })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      stale
    );
    expect(kv.put).not.toHaveBeenCalled();
  });

  it('falls back to FX_FALLBACK when there is neither cache nor upstream', async () => {
    const kv = createFakeKv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      FX_FALLBACK
    );
    expect(console.warn).toHaveBeenCalled();
  });

  it('ignores a corrupt cache entry and fetches instead', async () => {
    const kv = createFakeKv();
    kv._store.set(FX_CACHE_KEY, JSON.stringify({ rates: { EUR: 'x' }, fetchedAt: Date.now() }));
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(frankfurterBody({ CHF: 0.92, USD: 1.08, GBP: 0.85 })))
      )
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      LIVE
    );
  });

  it('never throws when KV itself fails', async () => {
    const kv = createFakeKv();
    (kv.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('kv down'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );

    await expect(getRates({ PARQET_KV: kv } as unknown as App.Platform['env'])).resolves.toEqual(
      FX_FALLBACK
    );
  });
});
