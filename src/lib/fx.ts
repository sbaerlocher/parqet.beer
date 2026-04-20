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

/** Convert an ISO 3166-1 alpha-2 country code to its flag emoji. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
