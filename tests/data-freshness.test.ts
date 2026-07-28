import { describe, it, expect } from 'vitest';
import { DATA_UPDATED_AT, formatDataDate } from '../src/lib/data-freshness';

// The tag is user-facing and derived from a build-time git value, so the
// failure modes worth pinning are: a missing/garbage date must render nothing
// (never "Invalid Date" or "NaN.NaN.NaN" in the UI), and a valid date must
// follow the locale convention used everywhere else in the app.
describe('formatDataDate', () => {
  it('formats German as DD.MM.YYYY', () => {
    expect(formatDataDate('2026-07-28', 'de')).toBe('28.07.2026');
  });

  it('formats English as ISO YYYY-MM-DD', () => {
    expect(formatDataDate('2026-07-28', 'en')).toBe('2026-07-28');
  });

  it('defaults to the German format', () => {
    expect(formatDataDate('2026-01-05')).toBe('05.01.2026');
  });

  it('returns null when the date is unavailable', () => {
    expect(formatDataDate(null)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(formatDataDate('')).toBeNull();
  });

  it('returns null for a malformed date', () => {
    expect(formatDataDate('not-a-date')).toBeNull();
    expect(formatDataDate('28.07.2026')).toBeNull();
    expect(formatDataDate('2026-7-8')).toBeNull();
  });

  it('returns null for a calendar-invalid date', () => {
    // 2026-13-01 fails as Invalid Date; 2026-02-31 and 2026-02-29 instead
    // roll over (to 03-03 and 03-01) and are only caught by the round-trip
    // day comparison — pinning both paths so neither check can be dropped.
    expect(formatDataDate('2026-13-01')).toBeNull();
    expect(formatDataDate('2026-02-31')).toBeNull();
    expect(formatDataDate('2026-02-29')).toBeNull();
    expect(formatDataDate('2026-04-31')).toBeNull();
  });

  it('accepts a leap day', () => {
    expect(formatDataDate('2028-02-29', 'de')).toBe('29.02.2028');
  });
});

describe('DATA_UPDATED_AT', () => {
  // Vitest runs without the Vite `define`, so `__DATA_UPDATED_AT__` is an
  // undeclared global here. This pins the `typeof` guard: dropping it for a
  // bare `__DATA_UPDATED_AT__ !== ''` would throw ReferenceError at import.
  it('is null when the build-time define is absent', () => {
    expect(DATA_UPDATED_AT).toBeNull();
  });
});
