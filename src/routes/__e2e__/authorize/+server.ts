// SPDX-License-Identifier: MIT
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';

/**
 * Stand-in for Parqet's `/oauth2/authorize`.
 *
 * Renders a consent page instead of redirecting straight back, on purpose:
 * the callback only works if the browser still holds the `__Host-` state and
 * verifier cookies, and those ride along on a real user-initiated navigation.
 * An automatic redirect would skip the very mechanism under test.
 *
 * The `code` handed back encodes which failure the test wants downstream —
 * see `../token/+server.ts`. Nothing is stored server-side, so tests stay
 * independent of each other and of execution order.
 */
export const GET: RequestHandler = async ({ platform, url }) => {
  assertE2e(platform);

  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const state = url.searchParams.get('state') ?? '';
  // Lets a test pick the downstream failure: `fail-token` / `fail-user`.
  const code = url.searchParams.get('e2e_code') ?? 'e2e-auth-code';

  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  target.searchParams.set('state', state);

  // Escape only what breaks out of the attribute — this page never renders
  // outside the e2e environment, but a mock that is trivially injectable is
  // still a bad pattern to leave in a repository.
  const href = target
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Mock Parqet Consent</title>
  </head>
  <body>
    <h1>Mock Parqet Consent</h1>
    <a data-testid="mock-consent-approve" href="${href}">Approve</a>
  </body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};
