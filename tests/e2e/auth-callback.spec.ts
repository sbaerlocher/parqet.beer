import { test, expect, type APIResponse } from '@playwright/test';

// Mirrors `OAUTH_STATE_COOKIE` / `OAUTH_VERIFIER_COOKIE` in
// `src/lib/server/auth.ts`. Duplicated as literals on purpose: importing from
// `$lib/server/*` into an e2e spec would pull server-only code into the test
// runner, and a drift in the cookie names should fail this suite loudly.
const STATE_COOKIE = '__Host-oauth_state';
const VERIFIER_COOKIE = '__Host-oauth_code_verifier';

// SvelteKit negotiates the error shape off the Accept header
// (`@sveltejs/kit` — `src/runtime/server/utils.js`, `negotiate(...)`): without
// `application/json` it serves the static HTML error page and `response.json()`
// throws. Every test below asserts on the JSON body, so the header is
// mandatory, not cosmetic.
const JSON_HEADERS = { Accept: 'application/json' };

// Both guard clauses in `callback/+server.ts` return 400, so the status alone
// cannot tell them apart. Asserting the message is what pins a test to the
// branch it is named after: `state !== storedState` is also true when the
// state cookie is simply absent, so a dropped `!storedState || !codeVerifier`
// guard would still yield 400 — from the wrong branch — and a status-only
// suite would stay green through that regression.
const MISSING_PARAMS = 'Missing OAuth parameters';
const INVALID_STATE = 'Invalid state parameter';

async function expectError(response: APIResponse, message: string) {
  expect(response.status()).toBe(400);
  const body = (await response.json()) as { message: string };
  expect(body.message).toBe(message);
}

// The `__Host-` prefix only constrains how a *client* stores a cookie (Secure,
// no Domain, Path=/). Sending one via a raw `Cookie` request header carries no
// such rule, so these cases need no browser context — `request` talks to the
// same worker the rest of the suite drives.
//
// Scope: only the guard clauses of `/api/auth/callback` are covered here, each
// pinned to its own rejection message. The browser-driven flow (success path,
// downstream failures, and the state mismatch as a real navigation) lives in
// `auth.spec.ts`.
test.describe('/api/auth/callback rejects invalid OAuth returns', () => {
  test('no query parameters → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback', { headers: JSON_HEADERS });
    await expectError(response, MISSING_PARAMS);
  });

  test('state without code → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback?state=some-state', {
      headers: JSON_HEADERS,
    });
    await expectError(response, MISSING_PARAMS);
  });

  test('code without state → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback?code=some-code', {
      headers: JSON_HEADERS,
    });
    await expectError(response, MISSING_PARAMS);
  });

  test('code and state but no cookies → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback?code=some-code&state=some-state', {
      headers: JSON_HEADERS,
    });
    await expectError(response, MISSING_PARAMS);
  });

  test('state cookie present but verifier cookie missing → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback?code=some-code&state=some-state', {
      headers: { ...JSON_HEADERS, Cookie: `${STATE_COOKIE}=some-state` },
    });
    await expectError(response, MISSING_PARAMS);
  });

  // The remaining sub-condition of the first guard: a verifier without the
  // state cookie. `code` and `state` are both present in the query, so the
  // absent state cookie is the only thing that can produce the rejection.
  test('verifier cookie present but state cookie missing → 400', async ({ request }) => {
    const response = await request.get('/api/auth/callback?code=some-code&state=some-state', {
      headers: { ...JSON_HEADERS, Cookie: `${VERIFIER_COOKIE}=some-verifier` },
    });
    await expectError(response, MISSING_PARAMS);
  });

  // The reason this file exists: the CSRF check. This is the only case that
  // must reach the *second* guard, which is why the message assertion matters
  // here as much as in the cases above.
  test('state mismatch → 400 "Invalid state parameter" and clears OAuth cookies', async ({
    request,
  }) => {
    const response = await request.get('/api/auth/callback?code=some-code&state=attacker-state', {
      headers: {
        ...JSON_HEADERS,
        Cookie: `${STATE_COOKIE}=session-state; ${VERIFIER_COOKIE}=some-verifier`,
      },
    });

    await expectError(response, INVALID_STATE);

    // `headersArray()` keeps repeated `Set-Cookie` headers separate;
    // `headers()` folds them into one string and would hide the second cookie.
    const setCookies = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'set-cookie')
      .map((header) => header.value);

    // The suite runs over HTTPS, so SvelteKit resolves `secure` to true and the
    // clearing cookie is one a real browser would actually accept under the
    // `__Host-` prefix rules. Asserting `Secure` alongside the expiry is what
    // makes this test prove the cookies are gone in a browser, not just that
    // the server meant to remove them.
    for (const cookieName of [STATE_COOKIE, VERIFIER_COOKIE]) {
      const cleared = setCookies.find((value) => value.startsWith(`${cookieName}=`));
      expect(cleared, `expected ${cookieName} to be cleared`).toBeDefined();
      expect(cleared).toContain('Max-Age=0');
      expect(cleared).toContain('Secure');
    }
  });
});
