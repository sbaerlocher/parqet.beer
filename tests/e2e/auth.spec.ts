import { test, expect, type Page } from '@playwright/test';

// Mirrors `E2E_USER_ID` in `src/routes/__e2e__/fixtures.ts`.
const E2E_USER_ID = 'e2e-user-1';

/**
 * Drive the full OAuth flow: landing → `/api/auth/login` → mock consent →
 * `/api/auth/callback` → `/dashboard`.
 *
 * `e2eCode` selects the downstream failure the mocks should inject
 * (`fail-token` → 500 from the token endpoint, `fail-user` → 500 from
 * userinfo). It reaches the authorize mock as an `e2e_code` query parameter.
 *
 * Getting it there needs care. `/api/auth/login` answers with a 302 to
 * `PARQET_AUTHORIZE_URL`, and rewriting that hop with `page.route()` is
 * unreliable: a redirect the server issues is not consistently surfaced as an
 * interceptable request, so the parameter silently goes missing and the mock
 * falls back to the success code — the flow then logs in and the failure-path
 * assertions fail against a working `/dashboard`.
 *
 * So the redirect is followed manually instead: click through to the authorize
 * page, then re-navigate to the same URL with `e2e_code` appended. Both hops
 * are real navigations from the browser, which is what the `__Host-` state and
 * verifier cookies need in order to ride along.
 */
async function login(page: Page, e2eCode?: string): Promise<void> {
  await page.goto('/');
  await page.locator('html[data-hydrated]').waitFor();
  await page.getByTestId('hero-cta').click();
  await page.getByTestId('mock-consent-approve').waitFor();

  if (e2eCode) {
    const authorizeUrl = new URL(page.url());
    authorizeUrl.searchParams.set('e2e_code', e2eCode);
    await page.goto(authorizeUrl.toString());
  }

  await page.getByTestId('mock-consent-approve').click();
}

test.describe('OAuth success path', () => {
  test('login lands on /dashboard with a live session', async ({ page }) => {
    await login(page);

    // `dashboard/+page.server.ts` redirects to `/` whenever `locals.session`
    // is null, so still being on /dashboard after the callback is itself the
    // assertion that the session cookie decrypted and the KV token was found.
    // Asserting on rendered portfolio numbers instead would couple this test
    // to the dashboard's client-side data loading.
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('session cookie is set with __Host- prefix and Secure', async ({ page, context }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === '__Host-auth_session');
    expect(session).toBeDefined();
    // The `__Host-` prefix is the reason the whole suite needs HTTPS: browsers
    // silently drop such cookies over plain HTTP, which is what made the
    // success path untestable before.
    expect(session?.secure).toBe(true);
    expect(session?.httpOnly).toBe(true);
    expect(session?.path).toBe('/');

    // One-shot OAuth cookies must be gone once the callback consumed them.
    expect(cookies.find((c) => c.name === '__Host-oauth_state')).toBeUndefined();
    expect(cookies.find((c) => c.name === '__Host-oauth_code_verifier')).toBeUndefined();
  });

  test('session survives a reload', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.reload();

    // A reload re-runs `hooks.server.ts` from scratch: cookie decrypt →
    // `getTokens(KV, userId)` → session. Staying on /dashboard therefore
    // proves the tokens really landed in KV under `token:{userId}`, without
    // exposing a KV read endpoint that would only widen the attack surface.
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('logged-in user clicking the CTA skips the OAuth round-trip', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/api/auth/login');

    // `login/+server.ts` short-circuits to /dashboard when a session exists,
    // so no consent page should appear.
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe('OAuth failure paths', () => {
  test('token exchange failure surfaces as an error, not a session', async ({ page, context }) => {
    await login(page, 'fail-token');

    await expect(page).not.toHaveURL(/\/dashboard$/);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === '__Host-auth_session')).toBeUndefined();
  });

  test('user-info failure surfaces as an error, not a session', async ({ page, context }) => {
    await login(page, 'fail-user');

    await expect(page).not.toHaveURL(/\/dashboard$/);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === '__Host-auth_session')).toBeUndefined();
  });

  test('callback with a mismatched state is rejected', async ({ page, context }) => {
    await page.goto('/');
    await page.locator('html[data-hydrated]').waitFor();
    await page.getByTestId('hero-cta').click();
    // The CTA goes through `/api/auth/login`'s 302 to the authorize mock, so
    // this waits on a full redirect chain. `waitFor` uses the suite's action
    // timeout rather than the 5s `toBeVisible` default, which a cold worker
    // under CI load can exceed — the assertion below is what actually matters.
    await page.getByTestId('mock-consent-approve').waitFor();

    // Same browser, valid verifier cookie, wrong state → CSRF guard must fire.
    const response = await page.goto('/api/auth/callback?code=e2e-auth-code&state=tampered');
    expect(response?.status()).toBe(400);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === '__Host-auth_session')).toBeUndefined();
  });
});

test.describe('logout', () => {
  test('logout clears the session and returns to the landing page', async ({ page, context }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    // The logout endpoint is POST-only and origin-checked; going through the
    // page's own fetch keeps both constraints satisfied.
    await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST', redirect: 'follow' }));

    await expect
      .poll(async () => (await context.cookies()).some((c) => c.name === '__Host-auth_session'))
      .toBe(false);

    // Session gone → the dashboard must bounce back to the landing page.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('e2e mock endpoints', () => {
  test('serve the fixed identity the auth flow is built on', async ({ request }) => {
    // Guards the contract the tests above depend on: if the mock's user id
    // drifts, the KV keys drift with it and the failures get cryptic.
    const response = await request.get('/__e2e__/user', {
      headers: { Authorization: 'Bearer e2e-access-token:e2e-auth-code' },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).userId).toBe(E2E_USER_ID);
  });
});
