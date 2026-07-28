import { test, expect } from '@playwright/test';

test.describe('demo mode', () => {
  test('demo dashboard is reachable without a session', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The banner is the visible proof that the read-only showcase rendered
    // without going through OAuth.
    await expect(page.getByText(/demo/i).first()).toBeVisible();
  });

  test('demo mode never calls the authenticated API', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      // `/api/health` is the dev-server warmup probe from playwright.config.ts,
      // not something the page requests — everything else under /api is a
      // session-only endpoint the demo must not touch.
      if (path.startsWith('/api/') && path !== '/api/health') apiCalls.push(path);
    });

    await page.goto('/dashboard?demo=1');
    await page.locator('html[data-hydrated]').waitFor();
    await page.waitForLoadState('networkidle');

    expect(apiCalls).toEqual([]);
  });

  test('a non-matching demo param still redirects to the landing page', async ({ page }) => {
    const response = await page.request.get('/dashboard?demo=0', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/');
  });
});
