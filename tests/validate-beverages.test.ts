import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateBeverageList, validateAllFiles } from '../scripts/validate-beverages.mjs';

// The standalone node validator is what contributors run before opening a
// price-update PR. These tests pin that (a) it actually rejects the malformed
// inputs the Zod schema rejects, and (b) the data currently on disk passes —
// so the script never green-lights broken data or red-flags valid data.

const validItem = { name: 'Test', size: '0.5l', price: 1.5, currency: 'EUR', country: 'DE' };
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'data');

describe('validateBeverageList', () => {
  it('accepts a valid list', () => {
    expect(validateBeverageList([validItem])).toEqual([]);
  });

  it('rejects a non-array', () => {
    expect(validateBeverageList({}).length).toBeGreaterThan(0);
  });

  it('rejects an empty array', () => {
    expect(validateBeverageList([]).length).toBeGreaterThan(0);
  });

  it('rejects a non-positive or non-numeric price', () => {
    expect(
      validateBeverageList([{ ...validItem, price: -1 }]).some((e) => e.includes('price'))
    ).toBe(true);
    expect(
      validateBeverageList([{ ...validItem, price: 'free' }]).some((e) => e.includes('price'))
    ).toBe(true);
  });

  it('rejects an unsupported currency', () => {
    expect(
      validateBeverageList([{ ...validItem, currency: 'USD' }]).some((e) => e.includes('currency'))
    ).toBe(true);
  });

  it('rejects a bad country code', () => {
    expect(
      validateBeverageList([{ ...validItem, country: 'DEU' }]).some((e) => e.includes('country'))
    ).toBe(true);
  });

  it('rejects case-insensitive duplicate names', () => {
    const errs = validateBeverageList([
      { ...validItem, name: 'Pilsner' },
      { ...validItem, name: 'PILSNER', size: '0.33l' },
    ]);
    expect(errs.some((e) => e.includes('duplicate'))).toBe(true);
  });
});

describe('on-disk data', () => {
  it('all beverage JSON files pass the validator', () => {
    const byFile = validateAllFiles(dataDir);
    for (const [file, errors] of Object.entries(byFile)) {
      expect(errors, `${file}: ${errors.join('; ')}`).toEqual([]);
    }
  });
});
