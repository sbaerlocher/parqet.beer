import { describe, it, expect } from 'vitest';
import { beverageListSchema } from '../src/lib/data/schema';
import beer from '../src/lib/data/beer.json';
import coffee from '../src/lib/data/coffee.json';
import smoothie from '../src/lib/data/smoothie.json';

describe.each([
  ['beer.json', beer],
  ['coffee.json', coffee],
  ['smoothie.json', smoothie],
])('%s schema validation', (name, data) => {
  it('matches beverage schema', () => {
    const result = beverageListSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`${name}: ${JSON.stringify(result.error.issues, null, 2)}`);
    }
    expect(result.success).toBe(true);
  });
});

// Negative tests pin the schema contract: shipping malformed data (a typo in
// a field name, a missing price, a duplicate entry, a string where a number
// belongs) would otherwise fall through into `calculator.ts` as NaN/undefined
// and break the UI silently.
describe('beverageListSchema rejects invalid data', () => {
  it('rejects an empty array', () => {
    const result = beverageListSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const result = beverageListSchema.safeParse([
      { name: 'Only a name', size: '0.5l', priceEur: 1.5 }, // priceChf missing
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('priceChf'))).toBe(true);
    }
  });

  it('rejects a non-numeric price', () => {
    const result = beverageListSchema.safeParse([
      { name: 'Bad', size: '0.5l', priceEur: 'free' as unknown as number, priceChf: 2 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = beverageListSchema.safeParse([
      { name: 'Bad', size: '0.5l', priceEur: -1, priceChf: 2 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects an infinite price', () => {
    const result = beverageListSchema.safeParse([
      { name: 'Bad', size: '0.5l', priceEur: Number.POSITIVE_INFINITY, priceChf: 2 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = beverageListSchema.safeParse([
      { name: '', size: '0.5l', priceEur: 1.5, priceChf: 2 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate beverage names (case-insensitive)', () => {
    const result = beverageListSchema.safeParse([
      { name: 'Pilsner', size: '0.5l', priceEur: 1.5, priceChf: 2 },
      { name: 'PILSNER', size: '0.33l', priceEur: 1.2, priceChf: 1.8 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Duplicate'))).toBe(true);
    }
  });
});
