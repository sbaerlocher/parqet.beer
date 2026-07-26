// SPDX-License-Identifier: MIT
/**
 * Achievements & streaks — pure, dependency-free logic.
 *
 * MVP scope (deliberately small): given the inputs the app already has
 * (portfolio value, total buyable beverage count, and a visit streak), decide
 * which achievements are unlocked. No server state, no KV. The streak itself
 * is computed from a list of visit timestamps the caller persists in
 * `localStorage` (see `recordVisit`/`streakFromDays` below) — see
 * `src/lib/stores/streak.ts` for the thin browser layer.
 *
 * If/when cross-device streaks are wanted, this module stays unchanged: only
 * the persistence layer would move from localStorage to KV (keyed by userId).
 * That server-state work is explicitly OUT of scope here.
 */

export type AchievementId =
  | 'first-beer-after-1k'
  | 'portfolio-10k'
  | 'portfolio-100k'
  | 'hundred-beverages'
  | 'thousand-beverages'
  | 'streak-7'
  | 'streak-30'
  | 'streak-100';

export interface Achievement {
  id: AchievementId;
  /** Emoji shown next to the achievement. */
  icon: string;
  title: { de: string; en: string };
  description: { de: string; en: string };
}

export interface AchievementInput {
  /** Portfolio value in EUR (already converted to the pivot currency). */
  portfolioValueEur: number;
  /** Total number of beverages buyable (any category) — drives count badges. */
  beverageCount: number;
  /** Current consecutive-day visit streak. */
  streakDays: number;
}

/**
 * The full catalogue. Each entry carries a pure predicate over the input.
 * Ordered roughly by difficulty so UIs can render them in a sensible sequence.
 */
interface AchievementDef extends Achievement {
  unlocked: (input: AchievementInput) => boolean;
}

const CATALOGUE: AchievementDef[] = [
  {
    id: 'first-beer-after-1k',
    icon: '🍺',
    title: { de: 'Erstes Bier', en: 'First Beer' },
    description: {
      de: 'Portfolio über 1.000 € — Zeit fürs erste Feierabendbier.',
      en: 'Portfolio over €1,000 — time for your first after-work beer.',
    },
    unlocked: (i) => i.portfolioValueEur >= 1_000,
  },
  {
    id: 'portfolio-10k',
    icon: '💰',
    title: { de: 'Fünfstellig', en: 'Five Figures' },
    description: {
      de: 'Portfolio über 10.000 €.',
      en: 'Portfolio over €10,000.',
    },
    unlocked: (i) => i.portfolioValueEur >= 10_000,
  },
  {
    id: 'portfolio-100k',
    icon: '🏦',
    title: { de: 'Sechsstellig', en: 'Six Figures' },
    description: {
      de: 'Portfolio über 100.000 €.',
      en: 'Portfolio over €100,000.',
    },
    unlocked: (i) => i.portfolioValueEur >= 100_000,
  },
  {
    id: 'hundred-beverages',
    icon: '🍻',
    title: { de: 'Runde für alle', en: 'Round for Everyone' },
    description: {
      de: '100+ Getränke im Portfolio.',
      en: '100+ beverages in your portfolio.',
    },
    unlocked: (i) => i.beverageCount >= 100,
  },
  {
    id: 'thousand-beverages',
    icon: '🎉',
    title: { de: 'Eigene Bar', en: 'Your Own Bar' },
    description: {
      de: '1.000+ Getränke — du könntest eine Bar eröffnen.',
      en: '1,000+ beverages — you could open a bar.',
    },
    unlocked: (i) => i.beverageCount >= 1_000,
  },
  {
    id: 'streak-7',
    icon: '🔥',
    title: { de: '7 Tage Streak', en: '7-Day Streak' },
    description: {
      de: '7 Tage in Folge vorbeigeschaut.',
      en: 'Checked in 7 days in a row.',
    },
    unlocked: (i) => i.streakDays >= 7,
  },
  {
    id: 'streak-30',
    icon: '⚡',
    title: { de: '30 Tage Streak', en: '30-Day Streak' },
    description: {
      de: '30 Tage in Folge vorbeigeschaut.',
      en: 'Checked in 30 days in a row.',
    },
    unlocked: (i) => i.streakDays >= 30,
  },
  {
    id: 'streak-100',
    icon: '🏆',
    title: { de: '100 Tage Streak', en: '100-Day Streak' },
    description: {
      de: '100 Tage in Folge — echte Hingabe.',
      en: '100 days in a row — true dedication.',
    },
    unlocked: (i) => i.streakDays >= 100,
  },
];

/** Strip the predicate so callers get plain data. */
function toAchievement({ unlocked: _unlocked, ...rest }: AchievementDef): Achievement {
  return rest;
}

/** All achievements, regardless of unlock state (for "locked/unlocked" grids). */
export function allAchievements(): Achievement[] {
  return CATALOGUE.map(toAchievement);
}

/** Only the achievements unlocked by the given input. */
export function unlockedAchievements(input: AchievementInput): Achievement[] {
  return CATALOGUE.filter((a) => a.unlocked(input)).map(toAchievement);
}

/** Convenience: just the unlocked ids (handy for diffing "new" unlocks). */
export function unlockedIds(input: AchievementInput): AchievementId[] {
  return CATALOGUE.filter((a) => a.unlocked(input)).map((a) => a.id);
}

// --- Streak computation (pure) ----------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** UTC day index for a timestamp — the unit a daily streak counts in. */
export function dayIndex(timestampMs: number): number {
  return Math.floor(timestampMs / MS_PER_DAY);
}

/**
 * Given the set of distinct days a user visited (as day indices) and the
 * current day, return the length of the consecutive run ending today (or
 * yesterday — a streak survives until the day after the last visit). Returns 0
 * if the user has not visited today or yesterday.
 */
export function streakFromDays(visitDayIndices: Iterable<number>, todayIndex: number): number {
  const days = new Set(visitDayIndices);
  if (days.size === 0) return 0;

  // A streak is still "alive" if the last visit was today or yesterday.
  if (!days.has(todayIndex) && !days.has(todayIndex - 1)) return 0;

  // Count back from the most recent active day.
  let cursor = days.has(todayIndex) ? todayIndex : todayIndex - 1;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

/**
 * Fold a new visit timestamp into a stored list of visit day indices, keeping
 * it sorted, de-duplicated, and capped to the most recent `maxDays` entries
 * (so localStorage doesn't grow without bound). Pure — caller persists the
 * result.
 */
export function recordVisit(storedDays: number[], timestampMs: number, maxDays = 400): number[] {
  const today = dayIndex(timestampMs);
  const set = new Set(storedDays);
  set.add(today);
  return [...set].sort((a, b) => a - b).slice(-maxDays);
}
