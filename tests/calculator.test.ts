import { describe, it, expect } from 'vitest';
import { calculateEquivalents, calculateFunStats, formatNumber } from '../src/lib/calculator';
import { convert, FX_FALLBACK, type FxRates } from '../src/lib/fx';
import type { Beverage } from '../src/lib/data/beverages';

const RATES: FxRates = { EUR: 1, CHF: 0.95, USD: 1.25, GBP: 0.8 };

describe('convert', () => {
  it('returns the value unchanged when currencies match', () => {
    expect(convert(100, 'EUR', 'EUR', RATES)).toBe(100);
    expect(convert(200, 'CHF', 'CHF', RATES)).toBe(200);
  });

  it('converts from the EUR base', () => {
    expect(convert(100, 'EUR', 'CHF', RATES)).toBeCloseTo(95, 5);
    expect(convert(100, 'EUR', 'USD', RATES)).toBeCloseTo(125, 5);
  });

  it('converts back into the EUR base', () => {
    expect(convert(95, 'CHF', 'EUR', RATES)).toBeCloseTo(100, 5);
    expect(convert(80, 'GBP', 'EUR', RATES)).toBeCloseTo(100, 5);
  });

  it('converts between two non-EUR currencies via the EUR pivot', () => {
    // 125 USD → 100 EUR → 80 GBP
    expect(convert(125, 'USD', 'GBP', RATES)).toBeCloseTo(80, 5);
    // …and back
    expect(convert(80, 'GBP', 'USD', RATES)).toBeCloseTo(125, 5);
  });

  it('defaults to the fallback rates when none are supplied', () => {
    expect(convert(100, 'EUR', 'CHF')).toBeCloseTo(100 * FX_FALLBACK.CHF, 5);
  });

  it('falls back to the original value for unsupported currency codes', () => {
    expect(convert(100, 'JPY', 'EUR', RATES)).toBe(100);
    expect(convert(100, 'EUR', 'JPY', RATES)).toBe(100);
  });
});

const testBeverages: Beverage[] = [
  { name: 'Test Beer', size: '330ml', price: 1.0, currency: 'EUR', country: 'DE' },
  { name: 'Fancy Beer', size: '500ml', price: 2.5, currency: 'EUR', country: 'DE' },
  { name: 'Swiss Beer', size: '330ml', price: 3.0, currency: 'CHF', country: 'CH' },
];

describe('calculateEquivalents', () => {
  it('calculates correct counts for same-currency beverages', () => {
    const result = calculateEquivalents(1000, 'EUR', testBeverages, RATES);
    expect(result[0]?.count).toBe(1000); // 1000 EUR / 1.0 EUR
    expect(result[1]?.count).toBe(400); // 1000 EUR / 2.5 EUR
  });

  it('converts portfolio to beverage currency for cross-currency', () => {
    const result = calculateEquivalents(1000, 'EUR', testBeverages, RATES);
    // 1000 EUR → 950 CHF / 3.0 CHF = 316
    expect(result[2]?.count).toBe(316);
  });

  it('converts CHF portfolio to EUR beverages', () => {
    const result = calculateEquivalents(1000, 'CHF', testBeverages, RATES);
    // 1000 CHF → 1052.63 EUR / 1.0 EUR = 1052
    expect(result[0]?.count).toBe(1052);
    // 1000 CHF / 3.0 CHF = 333
    expect(result[2]?.count).toBe(333);
  });

  it('converts a USD portfolio through the EUR pivot', () => {
    const result = calculateEquivalents(1250, 'USD', testBeverages, RATES);
    // 1250 USD → 1000 EUR / 1.0 EUR = 1000
    expect(result[0]?.count).toBe(1000);
    // 1250 USD → 1000 EUR → 950 CHF / 3.0 CHF = 316
    expect(result[2]?.count).toBe(316);
  });

  it('converts a GBP portfolio through the EUR pivot', () => {
    const result = calculateEquivalents(800, 'GBP', testBeverages, RATES);
    // 800 GBP → 1000 EUR / 2.5 EUR = 400
    expect(result[1]?.count).toBe(400);
  });

  it('uses the fallback rates when none are supplied', () => {
    const result = calculateEquivalents(1000, 'EUR', testBeverages);
    expect(result[2]?.count).toBe(Math.floor((1000 * FX_FALLBACK.CHF) / 3.0));
  });

  it('returns 0 for zero portfolio value', () => {
    const result = calculateEquivalents(0, 'EUR', testBeverages, RATES);
    expect(result[0]?.count).toBe(0);
  });

  it('preserves beverage metadata', () => {
    const result = calculateEquivalents(100, 'EUR', testBeverages, RATES);
    expect(result[0]?.name).toBe('Test Beer');
    expect(result[0]?.size).toBe('330ml');
    expect(result[0]?.price).toBe(1.0);
    expect(result[0]?.currency).toBe('EUR');
    expect(result[0]?.country).toBe('DE');
  });

  it('preserves Swiss beverage metadata', () => {
    const result = calculateEquivalents(100, 'EUR', testBeverages, RATES);
    expect(result[2]?.currency).toBe('CHF');
    expect(result[2]?.country).toBe('CH');
  });

  it('passes through a localized `note` when present', () => {
    const noted: Beverage[] = [
      {
        name: 'Noted Beer',
        size: '330ml',
        price: 1.0,
        currency: 'EUR',
        country: 'DE',
        note: { de: 'Lieblings-Bier', en: 'Favourite beer' },
      },
    ];
    const result = calculateEquivalents(100, 'EUR', noted, RATES);
    expect(result[0]?.note).toEqual({ de: 'Lieblings-Bier', en: 'Favourite beer' });
  });

  it('omits the `note` key entirely when the source beverage has none', () => {
    const result = calculateEquivalents(100, 'EUR', testBeverages, RATES);
    // `note` should not be present at all (exactOptionalPropertyTypes),
    // so `in` returns false rather than note === undefined.
    expect('note' in result[0]!).toBe(false);
  });
});

describe('calculateFunStats', () => {
  it('calculates per-day stats', () => {
    const result = calculateFunStats(365);
    expect(result.perDay).toBe(1);
  });

  it('calculates per-week stats', () => {
    const result = calculateFunStats(520);
    expect(result.perWeek).toBe(10);
  });

  it('calculates per-month stats', () => {
    const result = calculateFunStats(1200);
    expect(result.perMonth).toBe(100);
  });

  it('returns the full count as perYear', () => {
    const result = calculateFunStats(5000);
    expect(result.perYear).toBe(5000);
  });
});

describe('formatNumber', () => {
  it('formats numbers with locale separators', () => {
    const result = formatNumber(12647);
    expect(result).toContain('12');
    expect(result).toContain('647');
  });

  it('uses German grouping (U+202F narrow no-break space) by default', () => {
    // Intl switched to U+202F for German in Node 20+; accept either the old
    // period or the new narrow no-break space so the test doesn't flake on
    // older Node versions.
    const result = formatNumber(12647, 'de');
    expect(result.replace(/[\u202F.]/g, '')).toBe('12647');
  });

  it('uses English grouping with commas', () => {
    const result = formatNumber(12647, 'en');
    expect(result).toBe('12,647');
  });

  it('renders NaN as an em-dash', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(Number.NaN, 'en')).toBe('—');
  });

  it('renders Infinity as an em-dash', () => {
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('—');
    expect(formatNumber(Number.NEGATIVE_INFINITY)).toBe('—');
  });
});
