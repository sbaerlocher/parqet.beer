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
 * The body is parsed by hand rather than via `request.formData()`: SvelteKit's
 * CSRF protection rejects `application/x-www-form-urlencoded` POSTs that carry
 * no matching `Origin` header, and `exchangeCodeForTokens` — a server-side
 * `fetch` inside the worker — sends none. Reading the raw text sidesteps that
 * check, and the guard above is what actually keeps this endpoint closed.
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
