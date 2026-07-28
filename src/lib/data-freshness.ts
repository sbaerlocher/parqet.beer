// SPDX-License-Identifier: MIT
/**
 * "Stand vom" / "As of" tag for the beverage price data.
 *
 * The date is the last commit touching the four price files in
 * `src/lib/data/`, injected at build time by `vite.config.ts` as
 * `__DATA_UPDATED_AT__`. Build-time injection keeps it automatic — no
 * `meta.lastUpdated` field to maintain by hand, so it cannot drift from the
 * data it describes.
 *
 * Accurate to about a day, not to the minute: `%cs` is the *committer* date,
 * so a squash-merge or rebase stamps the merge date rather than the date the
 * contributor observed the price, and it renders in the committer's local
 * timezone. Fine for a freshness hint, which is all this is.
 */
import type { Locale } from './i18n';

/**
 * Build-time constant. Declared here rather than in `app.d.ts` because it is
 * a Vite `define` replacement, not an ambient runtime global.
 */
declare const __DATA_UPDATED_AT__: string | undefined;

/**
 * Raw injected value, or `null` when unavailable (e.g. a build from a tarball
 * with no git history, or a unit-test run without the define).
 */
export const DATA_UPDATED_AT: string | null =
  typeof __DATA_UPDATED_AT__ === 'string' && __DATA_UPDATED_AT__ !== ''
    ? __DATA_UPDATED_AT__
    : null;

/**
 * Format an ISO date (`YYYY-MM-DD`) for display.
 *
 * German locale renders `DD.MM.YYYY`, English `YYYY-MM-DD` (already ISO, so
 * it passes through). Returns `null` for anything unparseable — callers hide
 * the tag entirely rather than showing a broken date.
 */
export function formatDataDate(iso: string | null, locale: Locale = 'de'): string | null {
  if (!iso) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const [, year, month, day] = match;

  // Reject calendar-invalid dates that match the shape but aren't real days.
  // Both checks are load-bearing: an out-of-range month (2026-13-01) yields
  // Invalid Date, while an out-of-range day (2026-02-31) does *not* — V8
  // rolls it over to 2026-03-03, so only the round-trip comparison catches it.
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== Number(day)) return null;

  return locale === 'de' ? `${day}.${month}.${year}` : iso;
}
