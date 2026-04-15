import beerData from './beer.json';
import coffeeData from './coffee.json';
import smoothieData from './smoothie.json';

export interface Beverage {
  name: string;
  size: string;
  priceEur: number;
  priceChf: number;
}

export type BeverageCategory = 'beer' | 'coffee' | 'smoothie';
export type Currency = 'EUR' | 'CHF';

export const BEER_PRICES: Beverage[] = beerData;
export const COFFEE_PRICES: Beverage[] = coffeeData;
export const SMOOTHIE_PRICES: Beverage[] = smoothieData;

export const BEVERAGES: Record<BeverageCategory, Beverage[]> = {
  beer: BEER_PRICES,
  coffee: COFFEE_PRICES,
  smoothie: SMOOTHIE_PRICES,
};
