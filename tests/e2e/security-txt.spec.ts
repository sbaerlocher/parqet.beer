import { expect, test } from '@playwright/test';

// Runs against the built worker, which is the only place the routing question
// is observable: whether SvelteKit's scanner picks up the dot-prefixed
// `src/routes/.well-known/` directory and whether adapter-cloudflare routes the
// path to the worker instead of the assets binding. The unit tests call GET
// directly and would stay green even if the URL kept answering 404.
test('GET /.well-known/security.txt returns the RFC 9116 document', async ({ request }) => {
  const response = await request.get('/.well-known/security.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');

  const body = await response.text();
  expect(body).toMatch(/^Contact: mailto:/m);
  expect(body).toMatch(/^Expires: /m);
});
