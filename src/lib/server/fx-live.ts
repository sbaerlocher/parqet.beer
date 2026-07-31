// SPDX-License-Identifier: MIT
import { getCached } from './kv-cache';
import { FX_FALLBACK_RATES, DISPLAY_CURRENCIES } from '../fx';

// Live FX rates for the dashboard's currency toggle. Parqet only quotes the
// FX rate of currencies the user actually holds (typically just CHF), so it
// can't supply USD/GBP for the display toggle. We fetch daily ECB reference
// rates from frankfurter.app (free, no key, EUR-based) instead, cache them in
// KV for an hour, and fall back to the static FX_FALLBACK_RATES on any error
// so the UI never breaks on an upstream outage.
//
// frankfurter.app response shape: { base: "EUR", date: "…", rates: { CHF: …, USD: …, GBP: … } }

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';
const SYMBOLS = DISPLAY_CURRENCIES.filter((c) => c !== 'EUR'); // EUR is the pivot (rate 1)
const CACHE_KEY = 'fx:eur-rates';
const CACHE_TTL_SECONDS = 3600;

interface FrankfurterResponse {
  base?: string;
  rates?: Record<string, number>;
}

/** Fetch EUR→symbols rates from frankfurter.app. Returns null on any failure. */
async function fetchEurRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`${FRANKFURTER_URL}?from=EUR&to=${SYMBOLS.join(',')}`);
    if (!res.ok) return null;
    const body = (await res.json()) as FrankfurterResponse;
    if (body.base !== 'EUR' || !body.rates) return null;
    // Keep only the currencies we display, and only if numeric and positive.
    const rates: Record<string, number> = { EUR: 1 };
    for (const c of SYMBOLS) {
      const r = body.rates[c];
      if (typeof r !== 'number' || !(r > 0)) return null;
      rates[c] = r;
    }
    return rates;
  } catch {
    return null;
  }
}

/**
 * Return live "<currency> per EUR" multipliers for the display currencies,
 * cached in KV. Falls back to FX_FALLBACK_RATES when the upstream fetch fails
 * (and never caches that fallback — getCached skips null, and we only return
 * the fallback object here, never persist it).
 */
export async function getLiveFxRates(kv: KVNamespace): Promise<Record<string, number>> {
  const live = await getCached(kv, CACHE_KEY, CACHE_TTL_SECONDS, fetchEurRates);
  return live ?? FX_FALLBACK_RATES;
}
