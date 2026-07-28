// SPDX-License-Identifier: MIT
/**
 * FX types and conversion shared between client-side display (calculator.ts,
 * dashboard) and server-side holdings valuation (parqet-client.ts).
 *
 * Rates are EUR-based: `rates[X]` is "X per 1 EUR", the shape the ECB (and
 * Frankfurter, which republishes it) uses. EUR is therefore always 1 and acts
 * as the pivot for every pair — including pairs the ECB publishes no direct
 * rate for, like USD → GBP.
 *
 * This module is deliberately client-safe. The fetching/caching half lives in
 * `src/lib/server/fx-service.ts`, which SvelteKit keeps out of the browser
 * bundle; the constants and pure functions here are imported by both sides so
 * display and valuation can never drift apart.
 */

export const SUPPORTED_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP'] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/** EUR-based rates: `rates[X]` units of X per 1 EUR. */
export type FxRates = Record<Currency, number>;

/**
 * Last-resort rates when neither the upstream API nor the KV cache can supply
 * one. Rough long-term averages — the app converts portfolio values into
 * beverage counts, so being a few percent off is cosmetic, whereas showing no
 * number at all is not. CHF keeps the 0.95 this app shipped with before live
 * rates existed.
 */
export const FX_FALLBACK: FxRates = {
  EUR: 1,
  CHF: 0.95,
  USD: 1.08,
  GBP: 0.85,
};

/**
 * Guard for anything claiming to be `FxRates`: every supported currency
 * present, positive and finite. A zero, negative or non-finite rate would make
 * `convert` produce Infinity/NaN and the UI render an em-dash instead of a
 * number, so such a payload is treated as no payload at all.
 */
export function isUsableRates(value: unknown): value is FxRates {
  if (typeof value !== 'object' || value === null) return false;
  const rates = value as Record<string, unknown>;
  return SUPPORTED_CURRENCIES.every((code) => {
    const rate = rates[code];
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
  });
}

/**
 * Convert between any two currencies via the EUR pivot. Unknown currency codes
 * pass the value through unchanged — beverage data is schema-validated, so in
 * practice only supported codes reach here.
 */
export function convert(
  value: number,
  from: string,
  to: string,
  rates: FxRates = FX_FALLBACK
): number {
  if (from === to) return value;
  const fromRate = rates[from as Currency];
  const toRate = rates[to as Currency];
  if (fromRate === undefined || toRate === undefined) return value;
  return (value / fromRate) * toRate;
}

/** Convert an ISO 3166-1 alpha-2 country code to its flag emoji. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
