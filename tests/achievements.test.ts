import { describe, it, expect } from 'vitest';
import {
  allAchievements,
  unlockedAchievements,
  unlockedIds,
  dayIndex,
  streakFromDays,
  recordVisit,
  type AchievementInput,
} from '../src/lib/achievements';

const NONE: AchievementInput = { portfolioValueEur: 0, beverageCount: 0, streakDays: 0 };

describe('achievement unlocking', () => {
  it('unlocks nothing for an empty/zero input', () => {
    expect(unlockedIds(NONE)).toEqual([]);
  });

  it('unlocks the first beer at exactly 1.000 €', () => {
    expect(unlockedIds({ ...NONE, portfolioValueEur: 999 })).not.toContain('first-beer-after-1k');
    expect(unlockedIds({ ...NONE, portfolioValueEur: 1_000 })).toContain('first-beer-after-1k');
  });

  it('stacks portfolio tiers cumulatively', () => {
    const ids = unlockedIds({ ...NONE, portfolioValueEur: 150_000 });
    expect(ids).toEqual(
      expect.arrayContaining(['first-beer-after-1k', 'portfolio-10k', 'portfolio-100k'])
    );
  });

  it('unlocks beverage-count badges at their thresholds', () => {
    expect(unlockedIds({ ...NONE, beverageCount: 100 })).toContain('hundred-beverages');
    expect(unlockedIds({ ...NONE, beverageCount: 1_000 })).toContain('thousand-beverages');
    expect(unlockedIds({ ...NONE, beverageCount: 99 })).not.toContain('hundred-beverages');
  });

  it('unlocks streak badges at 7/30/100 days', () => {
    expect(unlockedIds({ ...NONE, streakDays: 7 })).toContain('streak-7');
    expect(unlockedIds({ ...NONE, streakDays: 30 })).toContain('streak-30');
    expect(unlockedIds({ ...NONE, streakDays: 100 })).toContain('streak-100');
    expect(unlockedIds({ ...NONE, streakDays: 6 })).not.toContain('streak-7');
  });

  it('exposes the full catalogue with bilingual copy', () => {
    const all = allAchievements();
    expect(all.length).toBeGreaterThanOrEqual(8);
    for (const a of all) {
      expect(a.title.de).toBeTruthy();
      expect(a.title.en).toBeTruthy();
      expect(a.description.de).toBeTruthy();
      expect(a.description.en).toBeTruthy();
    }
  });

  it('unlockedAchievements returns full objects, not just ids', () => {
    const unlocked = unlockedAchievements({ ...NONE, portfolioValueEur: 1_000 });
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0]).toMatchObject({ id: 'first-beer-after-1k', icon: '🍺' });
  });
});

describe('streak computation', () => {
  const TODAY = dayIndex(Date.UTC(2026, 5, 25, 12, 0, 0));

  it('returns 0 with no visits', () => {
    expect(streakFromDays([], TODAY)).toBe(0);
  });

  it('counts a consecutive run ending today', () => {
    expect(streakFromDays([TODAY - 2, TODAY - 1, TODAY], TODAY)).toBe(3);
  });

  it('survives one day of grace (last visit was yesterday)', () => {
    expect(streakFromDays([TODAY - 2, TODAY - 1], TODAY)).toBe(2);
  });

  it('breaks when the last visit is older than yesterday', () => {
    expect(streakFromDays([TODAY - 5, TODAY - 4], TODAY)).toBe(0);
  });

  it('ignores a gap in the middle, counting only the current run', () => {
    expect(streakFromDays([TODAY - 10, TODAY - 1, TODAY], TODAY)).toBe(2);
  });

  it('recordVisit de-dupes, sorts, and caps history', () => {
    const t = Date.UTC(2026, 5, 25, 8, 0, 0);
    const once = recordVisit([], t);
    expect(once).toEqual([dayIndex(t)]);
    // Same day again → no duplicate.
    const twice = recordVisit(once, t + 1000);
    expect(twice).toEqual([dayIndex(t)]);
    // Cap respected.
    const many = Array.from({ length: 500 }, (_, i) => i);
    expect(recordVisit(many, t, 400).length).toBe(400);
  });
});
