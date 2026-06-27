// SPDX-License-Identifier: MIT
/**
 * Demo-mode fixtures. A read-only showcase so first-time visitors can
 * experience the dashboard before going through Parqet OAuth. The numbers are
 * deliberately round and obviously illustrative (not a real portfolio) — the
 * UI surfaces a "demo" banner so nobody mistakes them for live data.
 *
 * Kept dependency-free and pure so it can be imported on both the server
 * (load function) and the client without pulling in any platform bindings.
 */

export interface DemoPortfolio {
  id: string;
  name: string;
  currency: string;
}

export interface DemoData {
  portfolios: DemoPortfolio[];
  /** Total portfolio value, expressed in `currency`. */
  totalValue: number;
  /** Trailing-12-month dividends, expressed in `currency`. */
  dividends: number;
  currency: string;
}

export const DEMO_DATA: DemoData = {
  portfolios: [
    { id: 'demo-world', name: 'Demo · World ETF', currency: 'EUR' },
    { id: 'demo-dividend', name: 'Demo · Dividend', currency: 'EUR' },
  ],
  // 42,000 EUR is a plausible mid-size retail portfolio and lands in a fun
  // range across every beverage category (thousands of beers, a few hundred
  // whiskies) without looking like a fabricated "perfect" number.
  totalValue: 42_000,
  dividends: 1_280,
  currency: 'EUR',
};
