import { describe, it, expect } from 'vitest';
import { beverageListSchema } from '../src/lib/data/schema';
import beer from '../src/lib/data/beer.json';
import coffee from '../src/lib/data/coffee.json';
import smoothie from '../src/lib/data/smoothie.json';

const validItem = { name: 'Test', size: '0.5l', price: 1.5, currency: 'EUR', country: 'DE' };

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
    const result = beverageListSchema.safeParse([{ name: 'Only a name', size: '0.5l' }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('price'))).toBe(true);
    }
  });

  it('rejects a non-numeric price', () => {
    const result = beverageListSchema.safeParse([
      { ...validItem, price: 'free' as unknown as number },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a negative price', () => {
    const result = beverageListSchema.safeParse([{ ...validItem, price: -1 }]);
    expect(result.success).toBe(false);
  });

  it('rejects an infinite price', () => {
    const result = beverageListSchema.safeParse([
      { ...validItem, price: Number.POSITIVE_INFINITY },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = beverageListSchema.safeParse([{ ...validItem, name: '' }]);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid currency', () => {
    const result = beverageListSchema.safeParse([{ ...validItem, currency: 'USD' }]);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate beverage names (case-insensitive)', () => {
    const result = beverageListSchema.safeParse([
      { ...validItem, name: 'Pilsner' },
      { ...validItem, name: 'PILSNER', size: '0.33l' },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Duplicate'))).toBe(true);
    }
  });
});
