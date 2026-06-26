import { describe, it, expect } from 'vitest';
import { applySecurityHeaders, isEmbeddablePath } from '../src/lib/server/security-headers';

// Pins the framing contract for the embed widget: every normal route must stay
// frame-blocked (clickjacking defense), while `/embed` must be iframe-able by
// third-party blogs. A regression here either breaks the widget (blogs can't
// embed) or silently re-exposes the whole app to clickjacking.
describe('embed path detection', () => {
  it('matches /embed and its subpaths only', () => {
    expect(isEmbeddablePath('/embed')).toBe(true);
    expect(isEmbeddablePath('/embed/beer')).toBe(true);
    expect(isEmbeddablePath('/')).toBe(false);
    expect(isEmbeddablePath('/dashboard')).toBe(false);
    expect(isEmbeddablePath('/embedded')).toBe(false); // not a real embed route
  });
});

describe('security headers framing', () => {
  it('blocks framing on normal routes', () => {
    const h = new Headers();
    applySecurityHeaders(h, '/dashboard');
    expect(h.get('X-Frame-Options')).toBe('DENY');
    expect(h.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });

  it('allows cross-origin framing on /embed', () => {
    const h = new Headers();
    applySecurityHeaders(h, '/embed');
    expect(h.get('X-Frame-Options')).toBeNull();
    expect(h.get('Content-Security-Policy')).toBe('frame-ancestors *');
    expect(h.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
  });

  it('keeps the other hardening headers intact on /embed', () => {
    const h = new Headers();
    applySecurityHeaders(h, '/embed');
    expect(h.get('X-Content-Type-Options')).toBe('nosniff');
    expect(h.get('Strict-Transport-Security')).toContain('max-age=');
  });
});
