import { describe, it, expect } from 'vitest';
import { DEMO_DATA } from '../src/lib/demo';
import { calculateEquivalents, convertValue } from '../src/lib/calculator';
import { BEVERAGES, BEVERAGE_CATEGORIES } from '../src/lib/data/beverages';
import { DISPLAY_CURRENCIES } from '../src/lib/fx';

// The demo fixture feeds the same calculator path as live data. These checks
// pin that the showcase numbers stay sane: positive value, a currency the UI
// can actually display, and at least one buyable beverage in every category so
// no demo tab renders an empty/zero dashboard.
describe('demo fixtures', () => {
  it('has a positive value and non-negative dividends', () => {
    expect(DEMO_DATA.totalValue).toBeGreaterThan(0);
    expect(DEMO_DATA.dividends).toBeGreaterThanOrEqual(0);
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
    for (const category of BEVERAGE_CATEGORIES) {
      const equivs = calculateEquivalents(
        DEMO_DATA.totalValue,
        DEMO_DATA.currency,
        BEVERAGES[category]
      );
      const total = equivs.reduce((sum, e) => sum + e.count, 0);
      expect(total, `category ${category} should yield at least one unit`).toBeGreaterThan(0);
    }
  });

  it('renders sensible counts across all display currencies', () => {
    for (const display of DISPLAY_CURRENCIES) {
      const converted = convertValue(DEMO_DATA.totalValue, DEMO_DATA.currency, display);
      expect(Number.isFinite(converted)).toBe(true);
      expect(converted).toBeGreaterThan(0);
    }
  });
});
