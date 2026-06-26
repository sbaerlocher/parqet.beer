// SPDX-License-Identifier: MIT
/**
 * Standalone validator for the beverage data files. Runs on plain Node (no TS
 * toolchain) so contributors and CI can sanity-check a price/data change
 * before opening a PR:
 *
 *   node scripts/validate-beverages.mjs
 *
 * It mirrors the Zod contract in `src/lib/data/schema.ts` (the runtime source
 * of truth that `tests/data-validation.test.ts` enforces). Kept dependency-free
 * and exporting `validateBeverageList` so it is unit-testable.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const VALID_CURRENCIES = new Set(['EUR', 'CHF']);

/**
 * Validate a parsed beverage array. Returns an array of human-readable error
 * strings — empty means valid.
 * @param {unknown} list
 * @param {string} label
 * @returns {string[]}
 */
export function validateBeverageList(list, label = 'data') {
  const errors = [];
  if (!Array.isArray(list)) return [`${label}: expected an array`];
  if (list.length === 0) errors.push(`${label}: array must not be empty`);

  const seen = new Set();
  list.forEach((item, i) => {
    const at = `${label}[${i}]`;
    if (typeof item !== 'object' || item === null) {
      errors.push(`${at}: expected an object`);
      return;
    }
    const { name, size, price, currency, country } = item;

    if (typeof name !== 'string' || name.trim().length === 0)
      errors.push(`${at}.name: required non-empty string`);
    if (typeof size !== 'string' || size.trim().length === 0)
      errors.push(`${at}.size: required non-empty string`);
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0)
      errors.push(`${at}.price: required positive finite number`);
    if (typeof currency !== 'string' || !VALID_CURRENCIES.has(currency))
      errors.push(`${at}.currency: must be one of EUR, CHF`);
    if (typeof country !== 'string' || country.length !== 2)
      errors.push(`${at}.country: must be a 2-letter ISO code`);

    if (typeof name === 'string') {
      const key = name.toLowerCase();
      if (seen.has(key)) errors.push(`${at}.name: duplicate beverage name "${name}"`);
      seen.add(key);
    }
  });

  return errors;
}

const FILES = ['beer.json', 'coffee.json', 'smoothie.json', 'whisky.json', 'wine.json'];

/**
 * Validate every data file on disk. Returns a map of file → errors.
 * @param {string} dataDir
 * @returns {Record<string, string[]>}
 */
export function validateAllFiles(dataDir) {
  /** @type {Record<string, string[]>} */
  const result = {};
  for (const file of FILES) {
    const raw = readFileSync(join(dataDir, file), 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result[file] = [`${file}: invalid JSON — ${msg}`];
      continue;
    }
    result[file] = validateBeverageList(parsed, file);
  }
  return result;
}

// Direct invocation (`node scripts/validate-beverages.mjs`) runs the CLI; when
// imported (tests) only the functions above are used.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'data');
  const byFile = validateAllFiles(dataDir);
  let total = 0;
  for (const [file, errors] of Object.entries(byFile)) {
    if (errors.length === 0) {
      console.log(`✓ ${file}`);
    } else {
      total += errors.length;
      console.error(`✗ ${file}`);
      for (const err of errors) console.error(`    ${err}`);
    }
  }
  if (total > 0) {
    console.error(`\n${total} validation error(s).`);
    process.exit(1);
  }
  console.log('\nAll beverage data valid.');
}
