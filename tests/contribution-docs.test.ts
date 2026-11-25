import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { BEVERAGE_CATEGORIES } from '../src/lib/data/beverages';
import { beverageSchema } from '../src/lib/data/schema';

// The public contribution path (issue template + CONTRIBUTING) drifted from the
// data once already: whisky landed in `beverages.ts` but never in the docs.
// These checks tie both documents to the categories and currencies the code
// actually accepts. ponytail: plain line match, no YAML parser — it matches any
// list line in the template, not only the dropdown options.
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const template = read('.github/ISSUE_TEMPLATE/beverage_data.yml');
const contributing = read('CONTRIBUTING.md');

const templateLines = template.split('\n').map((line) => line.trim().toLowerCase());
const hasOption = (value: string) => templateLines.includes(`- ${value.toLowerCase()}`);

describe.each(BEVERAGE_CATEGORIES)('category %s', (category) => {
  it('issue template offers it', () => {
    expect(hasOption(category)).toBe(true);
  });

  it('CONTRIBUTING lists its data file', () => {
    expect(contributing).toContain(`src/lib/data/${category}.json`);
  });
});

describe.each(beverageSchema.shape.currency.options)('currency %s', (currency) => {
  it('issue template offers it', () => {
    expect(hasOption(currency)).toBe(true);
  });
});
