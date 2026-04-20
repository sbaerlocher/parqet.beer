// SPDX-License-Identifier: MIT
import beerData from './beer.json';
import coffeeData from './coffee.json';
import smoothieData from './smoothie.json';
import type { Beverage } from './schema';
export type { Beverage } from './schema';

export type BeverageCategory = 'beer' | 'coffee' | 'smoothie';
export type Currency = 'EUR' | 'CHF';

export const BEER_PRICES = beerData as Beverage[];
export const COFFEE_PRICES = coffeeData as Beverage[];
export const SMOOTHIE_PRICES = smoothieData as Beverage[];

export const BEVERAGES: Record<BeverageCategory, Beverage[]> = {
  beer: BEER_PRICES,
  coffee: COFFEE_PRICES,
  smoothie: SMOOTHIE_PRICES,
};
