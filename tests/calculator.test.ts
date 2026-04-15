import { describe, it, expect } from 'vitest';
import { calculateEquivalents, calculateFunStats, formatNumber } from '../src/lib/calculator';
import type { Beverage } from '../src/lib/data/beverages';

const testBeverages: Beverage[] = [
  { name: 'Test Beer', size: '330ml', priceEur: 1.0, priceChf: 1.05 },
  { name: 'Fancy Beer', size: '500ml', priceEur: 2.5, priceChf: 2.63 },
];

describe('calculateEquivalents', () => {
  it('calculates correct counts in EUR', () => {
    const result = calculateEquivalents(1000, 'EUR', testBeverages);
    expect(result[0]?.count).toBe(1000);
    expect(result[1]?.count).toBe(400);
  });

  it('calculates correct counts in CHF', () => {
    const result = calculateEquivalents(1000, 'CHF', testBeverages);
    expect(result[0]?.count).toBe(952); // 1000 / 1.05
    expect(result[1]?.count).toBe(380); // 1000 / 2.63
  });

  it('returns 0 for zero portfolio value', () => {
    const result = calculateEquivalents(0, 'EUR', testBeverages);
    expect(result[0]?.count).toBe(0);
  });

  it('preserves beverage metadata', () => {
    const result = calculateEquivalents(100, 'EUR', testBeverages);
    expect(result[0]?.name).toBe('Test Beer');
    expect(result[0]?.size).toBe('330ml');
    expect(result[0]?.price).toBe(1.0);
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
