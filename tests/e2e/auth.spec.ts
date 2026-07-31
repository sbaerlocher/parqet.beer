import { test, expect } from '@playwright/test';

// These exercise the OAuth surface that runs without any Parqet mock: the
// login redirect contract and the callback's rejection paths. The happy-path
// token exchange (login → callback → /dashboard) needs a mocked
// PARQET_TOKEN_URL/API_URL and KV bindings, which this `vite dev` harness does
// not provide — see the "OAuth-Callback-Test" intake card for that follow-up.
test.describe('OAuth surface', () => {
  test('login redirects to the Parqet authorize endpoint with PKCE params', async ({ page }) => {
    // Don't follow the cross-origin redirect to Parqet — just assert the
    // 302 Location carries the PKCE challenge, state, and our redirect_uri.
    const response = await page.request.get('/api/auth/login', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    const target = new URL(location!);
    expect(target.searchParams.get('response_type')).toBe('code');
    expect(target.searchParams.get('code_challenge_method')).toBe('S256');
    expect(target.searchParams.get('code_challenge')).toBeTruthy();
    expect(target.searchParams.get('state')).toBeTruthy();
    expect(target.searchParams.get('redirect_uri')).toContain('/api/auth/callback');
    // Short-lived PKCE/state cookies must be set so the callback can verify.
    const setCookie = response.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('HttpOnly');
  });

  test('callback rejects a request with no OAuth parameters', async ({ page }) => {
    const response = await page.request.get('/api/auth/callback', { maxRedirects: 0 });
    expect(response.status()).toBe(400);
  });

  test('callback rejects a code without a matching state cookie', async ({ page }) => {
    // A code+state in the query but no stored state/verifier cookie is the
    // classic CSRF / replay shape — must be refused, not exchanged.
    const response = await page.request.get('/api/auth/callback?code=abc&state=xyz', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(400);
  });

  test('dashboard without a session redirects to the landing page', async ({ page }) => {
    const response = await page.request.get('/dashboard', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/');
  });

  test('demo dashboard is reachable without a session', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Demo banner proves the read-only showcase rendered without OAuth.
    await expect(page.getByText(/demo/i).first()).toBeVisible();
  });
});
