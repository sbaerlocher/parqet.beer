// SPDX-License-Identifier: MIT
/**
 * Combining store: turns the portfolio numbers the dashboard already computes
 * (value in EUR, buyable beverage count) plus the visit streak into the set of
 * unlocked achievements, and derives which of those are *newly* unlocked so a
 * toast fires once — not on every reload.
 *
 * All achievement/streak logic is pure and lives in `$lib/achievements`. This
 * file only wires inputs together and persists the "already seen" set in
 * localStorage (client-only, best-effort — same trade-offs as the streak
 * store). No server state.
 */
import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { streak } from '$lib/stores/streak';
import {
  allAchievements,
  unlockedAchievements,
  unlockedIds,
  type Achievement,
  type AchievementId,
  type AchievementInput,
} from '$lib/achievements';

const SEEN_KEY = 'achievements-seen';

/** Portfolio stats fed in by the dashboard; zero until it reports. */
const portfolio = writable<{ portfolioValueEur: number; beverageCount: number }>({
  portfolioValueEur: 0,
  beverageCount: 0,
});

/**
 * Dashboard entry point: report the current portfolio value (in EUR) and total
 * buyable beverage count. Safe to call from an `$effect`.
 */
export function setPortfolioStats(portfolioValueEur: number, beverageCount: number): void {
  portfolio.set({ portfolioValueEur, beverageCount });
}

/** The combined input to the pure achievement predicates. */
const input: Readable<AchievementInput> = derived([portfolio, streak], ([$portfolio, $streak]) => ({
  portfolioValueEur: $portfolio.portfolioValueEur,
  beverageCount: $portfolio.beverageCount,
  streakDays: $streak,
}));

/** All currently unlocked achievements, as full objects. */
export const unlocked: Readable<Achievement[]> = derived(input, ($input) =>
  unlockedAchievements($input)
);

/** All achievements regardless of state — for the locked/unlocked gallery. */
export const all: Achievement[] = allAchievements();

function loadSeen(): Set<AchievementId> {
  if (!browser) return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? (parsed as AchievementId[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<AchievementId>): void {
  if (!browser) return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage full / blocked — new unlocks may re-fire, which is harmless.
  }
}

// Seeded from localStorage so unlocks earned in a previous session don't toast
// again on reload.
const seen = loadSeen();

/**
 * Every id ever unlocked, from localStorage. The gallery unions this with the
 * currently-true predicates so a direct load of `/achievements` (bookmark,
 * refresh, new tab) doesn't render earned badges as locked just because the
 * dashboard hasn't fed the store in this session.
 */
export const seenIds: ReadonlySet<AchievementId> = seen;

/**
 * The ids unlocked since the last emission that weren't already seen. Emits the
 * fresh ids each time the input changes, then records them as seen so the next
 * derivation for the same unlocks yields an empty list.
 */
export const newlyUnlocked: Readable<AchievementId[]> = derived(input, ($input) => {
  const fresh = unlockedIds($input).filter((id) => !seen.has(id));
  if (fresh.length > 0) {
    fresh.forEach((id) => seen.add(id));
    saveSeen(seen);
  }
  return fresh;
});
