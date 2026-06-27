// SPDX-License-Identifier: MIT
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLiveFxRates } from '../src/lib/server/fx-live';
import { FX_FALLBACK_RATES } from '../src/lib/fx';

// A KV stub that always misses, so getCached calls the fetcher every time.
function emptyKv() {
  return {
    get: vi.fn(async () => null),
    put: vi.fn(async () => undefined),
  } as unknown as KVNamespace;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('getLiveFxRates', () => {
  it('returns live EUR-based rates from frankfurter.app', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ base: 'EUR', rates: { CHF: 0.93, USD: 1.07, GBP: 0.84 } }),
      }))
    );
    const rates = await getLiveFxRates(emptyKv());
    expect(rates).toEqual({ EUR: 1, CHF: 0.93, USD: 1.07, GBP: 0.84 });
  });

  it('falls back to the static table on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({}) }))
    );
    expect(await getLiveFxRates(emptyKv())).toBe(FX_FALLBACK_RATES);
  });

  it('falls back when the payload is missing a currency or has a bad value', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ base: 'EUR', rates: { CHF: 0.93, USD: -1 } }), // GBP missing, USD invalid
      }))
    );
    expect(await getLiveFxRates(emptyKv())).toBe(FX_FALLBACK_RATES);
  });

  it('falls back when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    expect(await getLiveFxRates(emptyKv())).toBe(FX_FALLBACK_RATES);
  });
});
