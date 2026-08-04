import { describe, it, expect } from 'vitest';
import { DEMO_DATA, demoTotals } from '../src/lib/demo';
import { calculateEquivalents, convertValue } from '../src/lib/calculator';
import { BEVERAGES, BEVERAGE_CATEGORIES } from '../src/lib/data/beverages';
import type { Currency } from '../src/lib/data/beverages';

// Every currency the dashboard can display. Keyed off the `Currency` union via
// `satisfies`, so adding a member there is a compile error here until the
// fixture is re-validated against it.
const DISPLAY_CURRENCIES = Object.keys({
  EUR: true,
  CHF: true,
} satisfies Record<Currency, true>) as Currency[];

const ALL_IDS = new Set(DEMO_DATA.portfolios.map((p) => p.id));

// The demo fixture feeds the same calculator path as live data. These checks
// pin that the showcase numbers stay sane: positive value, a currency the UI
// can actually display, and at least one buyable beverage in every category so
// no demo tab renders an empty/zero dashboard.
describe('demo fixtures', () => {
  it('has a positive value and non-negative dividends', () => {
    const totals = demoTotals(DEMO_DATA, ALL_IDS);
    expect(totals.totalValue).toBeGreaterThan(0);
    expect(totals.dividends).toBeGreaterThanOrEqual(0);
  });

  it('uses a currency the UI can display', () => {
    expect(DISPLAY_CURRENCIES as readonly string[]).toContain(DEMO_DATA.currency);
  });

  it('declares at least one portfolio, all in the same currency as the totals', () => {
    expect(DEMO_DATA.portfolios.length).toBeGreaterThan(0);
    for (const p of DEMO_DATA.portfolios) {
      expect(p.currency).toBe(DEMO_DATA.currency);
    }
  });

  it('produces a buyable count for every beverage category', () => {
    const { totalValue } = demoTotals(DEMO_DATA, ALL_IDS);
    for (const category of BEVERAGE_CATEGORIES) {
      const equivs = calculateEquivalents(totalValue, DEMO_DATA.currency, BEVERAGES[category]);
      const total = equivs.reduce((sum, e) => sum + e.count, 0);
      expect(total, `category ${category} should yield at least one unit`).toBeGreaterThan(0);
    }
  });

  it('renders sensible counts across all display currencies', () => {
    const { totalValue } = demoTotals(DEMO_DATA, ALL_IDS);
    for (const display of DISPLAY_CURRENCIES) {
      const converted = convertValue(totalValue, DEMO_DATA.currency, display);
      expect(Number.isFinite(converted)).toBe(true);
      expect(converted).toBeGreaterThan(0);
    }
  });
});

// The selector pills call the same helper, so a subset has to move the numbers.
// Without this, demo mode would render pills that visibly do nothing.
describe('demoTotals', () => {
  it('sums only the selected portfolios', () => {
    const [first] = DEMO_DATA.portfolios;
    expect(first).toBeDefined();
    const subset = demoTotals(DEMO_DATA, new Set([first!.id]));
    expect(subset.totalValue).toBe(first!.value);
    expect(subset.dividends).toBe(first!.dividends);
    expect(subset.totalValue).toBeLessThan(demoTotals(DEMO_DATA, ALL_IDS).totalValue);
  });

  it('returns zero when nothing is selected', () => {
    expect(demoTotals(DEMO_DATA, new Set())).toEqual({ totalValue: 0, dividends: 0 });
  });
});
