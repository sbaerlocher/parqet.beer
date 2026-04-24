// SPDX-License-Identifier: MIT
import beerData from './beer.json';
import coffeeData from './coffee.json';
import smoothieData from './smoothie.json';
import whiskyData from './whisky.json';
import type { Beverage } from './schema';
export type { Beverage, LocalizedNote } from './schema';

export type BeverageCategory = 'beer' | 'coffee' | 'smoothie' | 'whisky';
export type Currency = 'EUR' | 'CHF';

export const BEER_PRICES = beerData as Beverage[];
export const COFFEE_PRICES = coffeeData as Beverage[];
export const SMOOTHIE_PRICES = smoothieData as Beverage[];
export const WHISKY_PRICES = whiskyData as Beverage[];

export const BEVERAGES: Record<BeverageCategory, Beverage[]> = {
  beer: BEER_PRICES,
  coffee: COFFEE_PRICES,
  smoothie: SMOOTHIE_PRICES,
  whisky: WHISKY_PRICES,
};

export const BEVERAGE_CATEGORIES = Object.keys(BEVERAGES) as BeverageCategory[];

// Canonical glyph per category. `emoji` is the tab/header mark; `dividendEmoji`
// is the variant used in the "free dividend" context (beer gets 🍻 there).
export const CATEGORY_EMOJI: Record<BeverageCategory, string> = {
  beer: '🍺',
  coffee: '☕',
  smoothie: '🥤',
  whisky: '🥃',
};

export const CATEGORY_DIVIDEND_EMOJI: Record<BeverageCategory, string> = {
  ...CATEGORY_EMOJI,
  beer: '🍻',
};
