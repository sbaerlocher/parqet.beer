// SPDX-License-Identifier: MIT
/**
 * Thin localStorage layer for the visit streak. All real logic (what a streak
 * is, when it breaks) lives in the pure, tested `$lib/achievements` module —
 * this file only persists the list of visit days and exposes the current
 * streak as a readable store.
 *
 * Deliberately client-only and best-effort: a cleared browser resets the
 * streak. Cross-device streaks would require server state (KV keyed by userId)
 * and are intentionally out of scope for this MVP — see achievements.ts.
 */
import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import { dayIndex, recordVisit, streakFromDays } from '$lib/achievements';

const STORAGE_KEY = 'visit-days';

function loadDays(): number[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

/**
 * Record today's visit and return the current streak length. Safe to call on
 * mount; no-ops to 0 on the server.
 */
export function trackVisit(now: number = Date.now()): number {
  if (!browser) return 0;
  const updated = recordVisit(loadDays(), now);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full / blocked (private mode) — streak just won't persist.
  }
  return streakFromDays(updated, dayIndex(now));
}

/** Current streak as a store; seeds itself by tracking the current visit. */
export const streak = readable<number>(0, (set) => {
  if (browser) set(trackVisit());
});
