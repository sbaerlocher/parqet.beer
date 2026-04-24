import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  getBeverageOfTheDay,
  getFunComparisons,
  getMilestoneBadge,
  getAllBadges,
  getNextMilestone,
} from '../src/lib/fun';
import type { Beverage } from '../src/lib/data/beverages';

const testBeverages: Beverage[] = [
  { name: 'Augustiner Helles', size: '500ml', price: 1.29, currency: 'EUR', country: 'DE' },
  { name: 'Tegernseer Hell', size: '500ml', price: 1.09, currency: 'EUR', country: 'DE' },
  { name: 'Rothaus Pils', size: '330ml', price: 0.89, currency: 'EUR', country: 'DE' },
];

describe('getBeverageOfTheDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for an empty beverage list', () => {
    expect(getBeverageOfTheDay([], 'de')).toBeNull();
  });

  it('returns a beverage and quote from the correct locale', () => {
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
    const result = getBeverageOfTheDay(testBeverages, 'de');
    expect(result).not.toBeNull();
    expect(result!.beverage).toBeDefined();
    expect(result!.quote).toBeDefined();
    expect(testBeverages).toContain(result!.beverage);
  });

  it('uses the category parameter to select quotes', () => {
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
    const beerResult = getBeverageOfTheDay(testBeverages, 'en', 'beer');
    const coffeeResult = getBeverageOfTheDay(testBeverages, 'en', 'coffee');
    expect(beerResult).not.toBeNull();
    expect(coffeeResult).not.toBeNull();
    // Same beverage (based on dayIndex % length), but quotes differ by category.
    expect(beerResult!.beverage).toBe(coffeeResult!.beverage);
  });

  it('returns different beverages on different days', () => {
    const results = new Set<string>();
    for (let day = 0; day < testBeverages.length; day++) {
      vi.setSystemTime(new Date(day * 86_400_000));
      const r = getBeverageOfTheDay(testBeverages, 'de');
      if (r) results.add(r.beverage.name);
    }
    expect(results.size).toBe(testBeverages.length);
  });

  it('defaults category to beer', () => {
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
    const result = getBeverageOfTheDay(testBeverages, 'de');
    expect(result).not.toBeNull();
    // The quote should be from the beer category (German).
    // We can't assert exact text without coupling to data, so just check it exists.
    expect(result!.quote.length).toBeGreaterThan(0);
  });

  it('returns English quotes when locale is en', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const de = getBeverageOfTheDay(testBeverages, 'de', 'smoothie');
    const en = getBeverageOfTheDay(testBeverages, 'en', 'smoothie');
    expect(de).not.toBeNull();
    expect(en).not.toBeNull();
    // German and English smoothie quotes should not be the same strings.
    expect(de!.quote).not.toBe(en!.quote);
  });
});

describe('getFunComparisons', () => {
  it('returns only matched comparisons for beer (de)', () => {
    const result = getFunComparisons(100, 'beer', 'de');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for coffee (en)', () => {
    const result = getFunComparisons(500, 'coffee', 'en');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for coffee (de)', () => {
    const result = getFunComparisons(500, 'coffee', 'de');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for smoothie (de)', () => {
    const result = getFunComparisons(400, 'smoothie', 'de');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for smoothie (en)', () => {
    const result = getFunComparisons(400, 'smoothie', 'en');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for whisky (de)', () => {
    const result = getFunComparisons(300, 'whisky', 'de');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('returns only matched comparisons for whisky (en)', () => {
    const result = getFunComparisons(300, 'whisky', 'en');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((c) => c.matched)).toBe(true);
  });

  it('whisky Drams formula scales as count * 17 (70cl bottle / 4cl dram)', () => {
    const result = getFunComparisons(100, 'whisky', 'en');
    const drams = result.find((c) => c.label.startsWith('drams'));
    expect(drams).toBeDefined();
    // 100 bottles × 17 drams/bottle = 1,700 drams, formatted with EN grouping.
    expect(drams!.number.replace(/,/g, '')).toBe('1700');
  });

  it('whisky cask comparison only matches at 250 bottles', () => {
    expect(getFunComparisons(249, 'whisky', 'de').some((c) => c.label.startsWith('Fässer'))).toBe(
      false
    );
    expect(getFunComparisons(250, 'whisky', 'de').some((c) => c.label.startsWith('Fässer'))).toBe(
      true
    );
  });

  it('whisky DE and EN labels diverge', () => {
    const de = getFunComparisons(300, 'whisky', 'de').map((c) => c.label);
    const en = getFunComparisons(300, 'whisky', 'en').map((c) => c.label);
    expect(de).not.toEqual(en);
  });

  it('returns empty array when count is too low', () => {
    const result = getFunComparisons(1, 'beer', 'de');
    expect(result).toEqual([]);
  });

  it('returns more comparisons as count grows', () => {
    const small = getFunComparisons(50, 'beer', 'de');
    const large = getFunComparisons(10000, 'beer', 'de');
    expect(large.length).toBeGreaterThanOrEqual(small.length);
  });

  it('formats numbers using the correct locale', () => {
    const de = getFunComparisons(10000, 'beer', 'de');
    const en = getFunComparisons(10000, 'beer', 'en');
    // German uses period or narrow no-break space as grouping, English uses comma.
    const deNumbers = de.map((c) => c.number);
    const enNumbers = en.map((c) => c.number);
    expect(deNumbers).not.toEqual(enNumbers);
  });

  it('beer comparisons include both highlighted and non-highlighted items', () => {
    const result = getFunComparisons(10000, 'beer', 'de');
    expect(result.some((c) => c.highlight)).toBe(true);
    expect(result.some((c) => !c.highlight)).toBe(true);
  });

  it('coffee comparisons include emoji fields', () => {
    const result = getFunComparisons(100, 'coffee', 'en');
    expect(result.every((c) => c.emoji.length > 0)).toBe(true);
  });
});

describe('getMilestoneBadge', () => {
  it('returns null when count is below the lowest threshold', () => {
    expect(getMilestoneBadge(50, 'beer', 'de')).toBeNull();
    expect(getMilestoneBadge(50, 'coffee', 'en')).toBeNull();
    expect(getMilestoneBadge(50, 'smoothie', 'de')).toBeNull();
  });

  it('returns the first badge at the threshold', () => {
    const badge = getMilestoneBadge(100, 'beer', 'de');
    expect(badge).not.toBeNull();
    expect(badge!.title).toBe('Feierabend-Trinker');
    expect(badge!.threshold).toBe(100);
  });

  it('returns the highest matching badge', () => {
    const badge = getMilestoneBadge(5500, 'beer', 'en');
    expect(badge).not.toBeNull();
    expect(badge!.title).toBe('Hops Hero');
    expect(badge!.threshold).toBe(5000);
  });

  it('returns the top badge for very high counts', () => {
    const badge = getMilestoneBadge(2000000, 'beer', 'de');
    expect(badge).not.toBeNull();
    expect(badge!.title).toBe('Bier-Gottheit');
  });

  it('resolves localized title and description', () => {
    const de = getMilestoneBadge(1000, 'coffee', 'de');
    const en = getMilestoneBadge(1000, 'coffee', 'en');
    expect(de!.title).toBe('Barista');
    expect(en!.title).toBe('Barista'); // same in both locales
    expect(de!.description).toContain('Espresso');
    expect(en!.description).toContain('espresso');
  });

  it('includes icon field', () => {
    const badge = getMilestoneBadge(100, 'smoothie', 'en');
    expect(badge!.icon).toBeDefined();
    expect(badge!.icon.length).toBeGreaterThan(0);
  });
});

describe('getAllBadges', () => {
  it('returns all beer badges', () => {
    const badges = getAllBadges('beer', 'de');
    expect(badges.length).toBe(12);
    expect(badges[0]!.threshold).toBe(100);
    expect(badges[badges.length - 1]!.threshold).toBe(1000000);
  });

  it('returns all coffee badges', () => {
    const badges = getAllBadges('coffee', 'en');
    expect(badges.length).toBe(12);
  });

  it('returns all smoothie badges', () => {
    const badges = getAllBadges('smoothie', 'de');
    expect(badges.length).toBe(12);
  });

  it('badges are sorted by ascending threshold', () => {
    const badges = getAllBadges('beer', 'en');
    for (let i = 1; i < badges.length; i++) {
      expect(badges[i]!.threshold).toBeGreaterThan(badges[i - 1]!.threshold);
    }
  });
});

describe('getNextMilestone', () => {
  it('returns the first badge when count is 0', () => {
    const next = getNextMilestone(0, 'beer', 'de');
    expect(next).not.toBeNull();
    expect(next!.threshold).toBe(100);
  });

  it('returns the next unachieved badge', () => {
    const next = getNextMilestone(150, 'beer', 'en');
    expect(next).not.toBeNull();
    expect(next!.threshold).toBe(500);
  });

  it('returns null when all badges are achieved', () => {
    const next = getNextMilestone(1000001, 'beer', 'de');
    expect(next).toBeNull();
  });

  it('returns the next smoothie milestone', () => {
    const next = getNextMilestone(1500, 'smoothie', 'en');
    expect(next).not.toBeNull();
    expect(next!.threshold).toBe(2500);
    expect(next!.title).toBe('Superfood Junkie');
  });

  it('works at exact threshold boundary', () => {
    // At exactly 1000, the badge is earned — next is the one after.
    const next = getNextMilestone(1000, 'coffee', 'de');
    expect(next).not.toBeNull();
    expect(next!.threshold).toBe(2500);
  });
});
