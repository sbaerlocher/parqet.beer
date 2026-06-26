// SPDX-License-Identifier: MIT
import type { Beverage, LocalizedNote } from './data/beverages';
import type { Locale } from './i18n';
import { FX_RATES } from './fx';

// Convert via EUR as the pivot currency. `FX_RATES[c]` is "<c> per EUR", so
// EUR amount = value / fromRate, then target amount = eur * toRate. Unknown
// currencies fall back to the original value (count stays best-effort rather
// than rendering NaN).
export function convertValue(value: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return value;
  const fromRate = FX_RATES[fromCurrency];
  const toRate = FX_RATES[toCurrency];
  if (fromRate === undefined || toRate === undefined) return value;
  return (value / fromRate) * toRate;
}

export interface BeverageEquivalent {
  name: string;
  size: string;
  price: number;
  currency: string;
  country: string;
  count: number;
  note?: LocalizedNote;
}

export interface FunStats {
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
}

export function calculateEquivalents(
  portfolioValue: number,
  portfolioCurrency: string,
  beverages: Beverage[]
): BeverageEquivalent[] {
  return beverages.map((b) => {
    // Convert portfolio value into the beverage's own currency, then divide
    // by its local price. This gives the real count of how many you could buy
    // in that beverage's home country.
    const valueInBevCurrency = convertValue(portfolioValue, portfolioCurrency, b.currency);
    return {
      name: b.name,
      size: b.size,
      price: b.price,
      currency: b.currency,
      country: b.country,
      count: Math.floor(valueInBevCurrency / b.price),
      ...(b.note !== undefined && { note: b.note }),
    };
  });
}

export function calculateFunStats(count: number): FunStats {
  return {
    perDay: Math.round((count / 365) * 10) / 10,
    perWeek: Math.round((count / 52) * 10) / 10,
    perMonth: Math.round((count / 12) * 10) / 10,
    perYear: count,
  };
}

// Locale-aware number formatting. Defaults to German grouping for backwards
// compatibility with callers that haven't threaded the active locale through
// yet. When a locale is provided we use the canonical BCP-47 tag so thousands
// separators match the user's display language (1.234 vs 1,234).
//
// NaN and ±Infinity render as an em-dash: the calculator pipes FX-converted
// portfolio values through `Math.floor`/division, so a bad FX rate or an
// empty portfolio can leak non-finite values into the UI where `Intl`
// otherwise produces the literal string "NaN" or "∞".
export function formatNumber(n: number, locale: Locale = 'de'): string {
  if (!Number.isFinite(n)) return '—';
  const tag = locale === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }).format(n);
}
