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

import type { Currency } from './data/beverages';

export interface DemoPortfolio {
  id: string;
  name: string;
  currency: Currency;
  /** Portfolio value, expressed in `currency`. */
  value: number;
  /** Trailing-12-month dividends, expressed in `currency`. */
  dividends: number;
}

export interface DemoData {
  portfolios: DemoPortfolio[];
  currency: Currency;
}

export const DEMO_DATA: DemoData = {
  // The two entries sum to 42,000 EUR — a plausible mid-size retail portfolio
  // that lands in a fun range across every beverage category (thousands of
  // beers, a few hundred whiskies) without looking like a fabricated "perfect"
  // number. Values are per portfolio so the selector pills recompute a real
  // subtotal instead of sitting inert.
  portfolios: [
    { id: 'demo-world', name: 'Demo · World ETF', currency: 'EUR', value: 31_500, dividends: 780 },
    {
      id: 'demo-dividend',
      name: 'Demo · Dividend',
      currency: 'EUR',
      value: 10_500,
      dividends: 500,
    },
  ],
  currency: 'EUR',
};

/** Sum of the selected demo portfolios, mirroring what `/api/performance` returns. */
export function demoTotals(
  data: DemoData,
  selectedIds: Set<string>
): { totalValue: number; dividends: number } {
  const selected = data.portfolios.filter((p) => selectedIds.has(p.id));
  return {
    totalValue: selected.reduce((sum, p) => sum + p.value, 0),
    dividends: selected.reduce((sum, p) => sum + p.dividends, 0),
  };
}
