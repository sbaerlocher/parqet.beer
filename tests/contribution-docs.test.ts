import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { BEVERAGE_CATEGORIES } from '../src/lib/data/beverages';
import { beverageSchema } from '../src/lib/data/schema';

// The public contribution path (issue template + CONTRIBUTING) drifted from the
// data once already: whisky landed in `beverages.ts` but never in the docs.
// These checks tie both documents to the categories and currencies the code
// actually accepts. No YAML parser: the template is split into its `- type:`
// blocks and only the option lines of the named dropdown are compared.
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const template = read('.github/ISSUE_TEMPLATE/beverage_data.yml');
const contributing = read('CONTRIBUTING.md');

const templateBlocks = template
  .split('\n  - type:')
  .map((block) => block.split('\n').map((line) => line.trim()));
const dropdownOptions = (id: string) =>
  (templateBlocks.find((lines) => lines.includes(`id: ${id}`)) ?? [])
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).toLowerCase());

const contributingCurrencyLine =
  contributing.split('\n').find((line) => line.trim().startsWith('"currency":')) ?? '';

describe.each(BEVERAGE_CATEGORIES)('category %s', (category) => {
  it('issue template offers it', () => {
    expect(dropdownOptions('category')).toContain(category);
  });

  it('CONTRIBUTING lists its data file', () => {
    expect(contributing).toContain(`src/lib/data/${category}.json`);
  });
});

describe.each(beverageSchema.shape.currency.options)('currency %s', (currency) => {
  it('issue template offers it', () => {
    expect(dropdownOptions('currency')).toContain(currency.toLowerCase());
  });

  it('CONTRIBUTING schema block lists it', () => {
    expect(contributingCurrencyLine).toContain(currency);
  });
});
