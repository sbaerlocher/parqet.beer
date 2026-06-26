import { describe, it, expect } from 'vitest';
import { isBeaconEnabled, beaconConfig } from '../src/lib/analytics';

// Pins the analytics conditional: the CF Web Analytics beacon must stay OFF
// unless a real token is configured, so local dev and preview never ship
// tracking and the privacy page's "cookieless, only when configured" promise
// holds. Also pins the exact `data-cf-beacon` payload Cloudflare parses.
describe('analytics beacon conditional', () => {
  it('is disabled when the token is missing, empty, or whitespace', () => {
    expect(isBeaconEnabled(undefined)).toBe(false);
    expect(isBeaconEnabled(null)).toBe(false);
    expect(isBeaconEnabled('')).toBe(false);
    expect(isBeaconEnabled('   ')).toBe(false);
  });

  it('is enabled for a real token', () => {
    expect(isBeaconEnabled('abc123')).toBe(true);
  });

  it('returns no config (null) when disabled', () => {
    expect(beaconConfig(undefined)).toBeNull();
    expect(beaconConfig('')).toBeNull();
  });

  it('returns a valid JSON beacon payload when enabled', () => {
    const config = beaconConfig('  token-xyz  ');
    expect(config).not.toBeNull();
    expect(JSON.parse(config as string)).toEqual({ token: 'token-xyz' });
  });
});
