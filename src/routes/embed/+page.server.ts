// SPDX-License-Identifier: MIT
import type { PageServerLoad } from './$types';
import { DEMO_DATA } from '$lib/demo';
import { calculateEquivalents } from '$lib/calculator';
import { BEVERAGES, CATEGORY_EMOJI, type BeverageCategory } from '$lib/data/beverages';
import { DISPLAY_CURRENCIES, type DisplayCurrency } from '$lib/fx';

// Read-only embed widget for blogs. No auth, no session — it renders a single
// "X portfolio = Y beverages" line from either query params or the demo
// fixture, so a blogger can drop an <iframe> in and it just works.
//
// Query params (all optional):
//   value     portfolio value (number); falls back to the demo value
//   currency  EUR | CHF | USD | GBP; falls back to demo currency
//   category  beer | coffee | smoothie | whisky | wine; defaults to beer
const VALID_CATEGORIES = Object.keys(BEVERAGES) as BeverageCategory[];

function parseCategory(raw: string | null): BeverageCategory {
  return raw && (VALID_CATEGORIES as string[]).includes(raw) ? (raw as BeverageCategory) : 'beer';
}

function parseValue(raw: string | null): number {
  const n = raw === null ? NaN : Number(raw);
  // Guard against NaN/negative/Infinity leaking into the calculator.
  return Number.isFinite(n) && n > 0 ? n : DEMO_DATA.totalValue;
}

function parseCurrency(raw: string | null): DisplayCurrency {
  const upper = raw?.toUpperCase();
  return upper && (DISPLAY_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as DisplayCurrency)
    : (DEMO_DATA.currency as DisplayCurrency);
}

export const load: PageServerLoad = ({ url }) => {
  const category = parseCategory(url.searchParams.get('category'));
  const value = parseValue(url.searchParams.get('value'));
  const currency = parseCurrency(url.searchParams.get('currency'));
  const isDemo = !url.searchParams.has('value');

  // Pick the cheapest representative beverage in the category so the headline
  // count is the "best case" (most fun) — mirrors the playful tone of the app.
  const equivalents = calculateEquivalents(value, currency, BEVERAGES[category]);
  const best = equivalents.reduce((a, b) => (b.count > a.count ? b : a));

  return {
    category,
    emoji: CATEGORY_EMOJI[category],
    value,
    currency,
    count: best.count,
    beverageName: best.name,
    isDemo,
  };
};
