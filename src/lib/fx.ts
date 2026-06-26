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
 * Additional display currencies. Rates are "<currency> per EUR" multipliers,
 * mirroring EUR_TO_CHF_RATE. Long-term rough averages (USD ≈ 1.08, GBP ≈ 0.85
 * per EUR) used only for the fun beverage-count display — not for valuation.
 * USD/GBP are display targets only; beverage reference prices stay in EUR/CHF.
 */
export const EUR_TO_USD_RATE = 1.08;
export const EUR_TO_GBP_RATE = 0.85;

/**
 * EUR-per-unit multipliers for every supported display currency, keyed by ISO
 * 4217 code. EUR is the pivot: any pair converts via EUR. Single source of
 * truth for `convertValue` and the currency toggles.
 */
export const FX_RATES: Record<string, number> = {
  EUR: 1,
  CHF: EUR_TO_CHF_RATE,
  USD: EUR_TO_USD_RATE,
  GBP: EUR_TO_GBP_RATE,
};

/** Display currencies the UI lets the user toggle between. */
export const DISPLAY_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

/** Convert an ISO 3166-1 alpha-2 country code to its flag emoji. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
