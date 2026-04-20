import { describe, it, expect } from 'vitest';
import { translations } from '../src/lib/i18n';

describe('i18n translations', () => {
  const de = translations.de;
  const en = translations.en;
  const deKeys = Object.keys(de);
  const enKeys = Object.keys(en);

  it('both locales have the same keys', () => {
    expect(deKeys.sort()).toEqual(enKeys.sort());
  });

  it('no translation value is empty', () => {
    for (const key of deKeys) {
      const val = de[key as keyof typeof de];
      if (typeof val === 'string') {
        expect(val.length, `de.${key} is empty`).toBeGreaterThan(0);
      }
    }
    for (const key of enKeys) {
      const val = en[key as keyof typeof en];
      if (typeof val === 'string') {
        expect(val.length, `en.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('function translations have matching signatures', () => {
    // All function-typed translations must exist in both locales.
    for (const key of deKeys) {
      const deVal = de[key as keyof typeof de];
      const enVal = en[key as keyof typeof en];
      if (typeof deVal === 'function') {
        expect(typeof enVal, `en.${key} should be a function`).toBe('function');
        expect(deVal.length, `de.${key} arity should match en.${key}`).toBe(
          (enVal as (...args: unknown[]) => unknown).length
        );
      }
    }
  });

  it('portfoliosOf returns correct string in both locales', () => {
    expect(de.portfoliosOf(3, 5)).toBe('3 von 5 Portfolios');
    expect(en.portfoliosOf(3, 5)).toBe('3 of 5 portfolios');
  });

  it('shareTitle returns correct string in both locales', () => {
    const deTitle = de.shareTitle('42', 'Bier', '🍺');
    expect(deTitle).toContain('42');
    expect(deTitle).toContain('Bier');

    const enTitle = en.shareTitle('42', 'Beer', '🍺');
    expect(enTitle).toContain('42');
    expect(enTitle).toContain('Beer');
  });

  it('shareText returns correct string in both locales', () => {
    expect(de.shareText('100', 'Kaffee', '☕')).toContain('100');
    expect(en.shareText('100', 'Coffee', '☕')).toContain('100');
  });

  it('sharePreviewAlt returns correct string in both locales', () => {
    expect(de.sharePreviewAlt('50', 'Smoothie')).toContain('50');
    expect(en.sharePreviewAlt('50', 'Smoothie')).toContain('50');
  });
});
