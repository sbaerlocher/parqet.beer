// SPDX-License-Identifier: MIT
/**
 * Pure helpers for the Cloudflare Web Analytics beacon. Kept separate from the
 * Svelte component so the conditional ("inject the beacon only when a token is
 * configured") is unit-testable without a DOM or the `$env` module.
 *
 * LIMIT: Cloudflare Web Analytics is pageview + Web Vitals only. It cannot emit
 * custom events without Cloudflare Zaraz, so per-beverage popularity is out of
 * scope here. A `/dashboard` pageview count is a usable OAuth-completion proxy.
 */

/**
 * Whether the analytics beacon should be injected at all. A token is required;
 * undefined/empty/whitespace-only means "analytics disabled" so local dev and
 * preview stay tracking-free until a real production token is set.
 */
export function isBeaconEnabled(token: string | undefined | null): boolean {
  return typeof token === 'string' && token.trim().length > 0;
}

/**
 * The `data-cf-beacon` attribute payload Cloudflare expects. Returns null when
 * disabled so callers can branch on a single value.
 */
export function beaconConfig(token: string | undefined | null): string | null {
  if (!isBeaconEnabled(token)) return null;
  return JSON.stringify({ token: (token as string).trim() });
}
