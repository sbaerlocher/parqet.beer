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
    expect(body).toContain('Contact: mailto:security@parqet.beer');
    expect(body).toContain('Preferred-Languages: de, en');
    expect(body).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T.+Z$/m);
  });

  it('sets Expires in the future', async () => {
    const response = await GET({} as never);
    const body = await response.text();
    const expires = /^Expires: (.+)$/m.exec(body)?.[1];
    expect(expires).toBeDefined();
    expect(Date.parse(expires as string)).toBeGreaterThan(Date.now());
  });
});
