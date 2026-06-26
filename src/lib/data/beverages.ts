// SPDX-License-Identifier: MIT
import beerData from './beer.json';
import coffeeData from './coffee.json';
import smoothieData from './smoothie.json';
import whiskyData from './whisky.json';
import wineData from './wine.json';
import type { Beverage } from './schema';
export type { Beverage, LocalizedNote } from './schema';

export type BeverageCategory = 'beer' | 'coffee' | 'smoothie' | 'whisky' | 'wine';
export type Currency = 'EUR' | 'CHF';

export const BEER_PRICES = beerData as Beverage[];
export const COFFEE_PRICES = coffeeData as Beverage[];
export const SMOOTHIE_PRICES = smoothieData as Beverage[];
export const WHISKY_PRICES = whiskyData as Beverage[];
// Wine prices: standard 750ml bottles at German retail (EUR) / Swiss retail
// (CHF) reference levels — discounter/supermarket and mid-range bottles
// (e.g. Lidl Bordeaux ~4€, Chianti Classico ~10€, Barolo ~28€, CH Dôle ~16
// CHF). Same origin/currency convention as the other JSONs (see schema.ts).
export const WINE_PRICES = wineData as Beverage[];

export const BEVERAGES: Record<BeverageCategory, Beverage[]> = {
  beer: BEER_PRICES,
  coffee: COFFEE_PRICES,
  smoothie: SMOOTHIE_PRICES,
  whisky: WHISKY_PRICES,
  wine: WINE_PRICES,
};

export const BEVERAGE_CATEGORIES: BeverageCategory[] = [
  'beer',
  'coffee',
  'smoothie',
  'whisky',
  'wine',
];

// Canonical glyph per category. `emoji` is the tab/header mark; `dividendEmoji`
// is the variant used in the "free dividend" context (beer gets 🍻 there).
export const CATEGORY_EMOJI: Record<BeverageCategory, string> = {
  beer: '🍺',
  coffee: '☕',
  smoothie: '🥤',
  whisky: '🥃',
  wine: '🍷',
};

export const CATEGORY_DIVIDEND_EMOJI: Record<BeverageCategory, string> = {
  ...CATEGORY_EMOJI,
  beer: '🍻',
};
