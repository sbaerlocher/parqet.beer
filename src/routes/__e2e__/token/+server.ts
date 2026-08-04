// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';

/**
 * Stand-in for Parqet's `/oauth2/token`, for both `authorization_code` and
 * `refresh_token` grants.
 *
 * The response must satisfy `TokenResponseSchema` in
 * `$lib/server/parqet-client` — a partial object makes Zod throw inside
 * `exchangeCodeForTokens`, which swallows it and returns null, surfacing as a
 * generic 500 that says nothing about the actual cause.
 *
 * Failure selection travels through the `code` value (`fail-token` → 500 here,
 * `fail-user` → 500 in `../user`), so it is carried forward in the minted
 * access token rather than held in server state that would leak between
 * parallel tests.
 *
 * SvelteKit's CSRF guard rejects urlencoded POSTs whose `Origin` does not match
 * the request origin, and it runs in `respond.js` *before* this handler — so how
 * the body is read here cannot influence it. `exchangeCodeForTokens` therefore
 * sets `Origin` from the redirect URI, which for e2e is this same origin. The
 * guard above is what keeps the endpoint closed; the check is only satisfied,
 * never bypassed. (The guard also sits behind `!__SVELTEKIT_DEV__`, which is why
 * it only appeared once the suite moved off `vite dev` onto the built worker.)
 */
export const POST: RequestHandler = async ({ platform, request }) => {
  assertE2e(platform);

  const form = new URLSearchParams(await request.text());
  const grantType = form.get('grant_type');
  const code = String(form.get('code') ?? '');

  if (code === 'fail-token') {
    return json({ error: 'server_error' }, { status: 500 });
  }

  // PKCE is checked for presence only. Verifying the S256 challenge would
  // require carrying it across the authorize call, and the derivation itself
  // is already covered by the unit tests in `tests/pkce.test.ts`.
  if (grantType === 'authorization_code' && !form.get('code_verifier')) {
    return json({ error: 'invalid_request' }, { status: 400 });
  }

  return json({
    access_token: `e2e-access-token:${code || 'refreshed'}`,
    refresh_token: 'e2e-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
  });
};
