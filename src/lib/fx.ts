// SPDX-License-Identifier: MIT
/**
 * FX constants shared between client-side display (calculator.ts) and
 * server-side holdings valuation (parqet-client.ts).
 *
 * Convention: rate is "CHF per EUR", used as a multiplier in
 *   chf_value = eur_value * EUR_TO_CHF_RATE
 *   eur_value = chf_value / EUR_TO_CHF_RATE
 *
 * Long-term average: 1 EUR ≈ 0.95 CHF (CHF slightly stronger). Kept here as
 * a single source of truth so client display and server valuation never
 * drift apart.
 */
export const EUR_TO_CHF_RATE = 0.95;

/**
 * Static FALLBACK multipliers ("<currency> per EUR"), used only when no live
 * rate is available — the dashboard fetches live ECB rates server-side
 * (`src/lib/server/fx-live.ts`, frankfurter.app, KV-cached) and threads them
 * into `convertValue`. These rough long-term averages just keep the UI from
 * rendering a wildly wrong number on an upstream FX outage. USD/GBP are
 * display targets only; beverage reference prices stay in EUR/CHF.
 */
export const FX_FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  CHF: EUR_TO_CHF_RATE,
  USD: 1.08,
  GBP: 0.85,
};

/**
 * Default rate table for code paths that have no live rates threaded through.
 * EUR is the pivot: any pair converts via EUR. Live consumers pass the fetched
 * map into `convertValue` instead of relying on this.
 */
export const FX_RATES: Record<string, number> = FX_FALLBACK_RATES;

/** Display currencies the UI lets the user toggle between. */
export const DISPLAY_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Convert an ISO 3166-1 alpha-2 country code to its flag emoji. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
