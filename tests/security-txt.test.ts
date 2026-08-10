import { describe, it, expect } from 'vitest';
import { GET } from '../src/routes/.well-known/security.txt/+server';

// Same shape as the health probe: the handler takes a SvelteKit `RequestEvent`
// but only uses it structurally, so `{} as never` avoids the event factory.
describe('/.well-known/security.txt', () => {
  it('returns text/plain with Contact, Expires and Preferred-Languages', async () => {
    const response = await GET({} as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');

    const body = await response.text();
    // Must stay in sync with SECURITY.md — a security.txt that advertises a
    // different address than the policy sends reports into a void.
    expect(body).toContain('Contact: mailto:simon@baerlocher.ch');
    expect(body).toContain('Preferred-Languages: de, en');
    expect(body).toContain(
      'Policy: https://github.com/sbaerlocher/parqet.beer/blob/main/SECURITY.md'
    );
    expect(body).toContain('Canonical: https://parqet.beer/.well-known/security.txt');
    expect(body).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T.+Z$/m);
  });

  it('sets Expires in the future but under a year out', async () => {
    const response = await GET({} as never);
    const body = await response.text();
    const expires = /^Expires: (.+)$/m.exec(body)?.[1];
    expect(expires).toBeDefined();

    const parsed = Date.parse(expires as string);
    expect(parsed).toBeGreaterThan(Date.now());
    // RFC 9116 §2.5.5 recommends less than a year out — catches a careless
    // bump of EXPIRES_MONTHS that would make the document non-conforming.
    expect(parsed).toBeLessThan(Date.now() + 365 * 24 * 60 * 60 * 1000);
  });
});
