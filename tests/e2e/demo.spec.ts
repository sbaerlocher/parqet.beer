import { test, expect } from '@playwright/test';

test.describe('demo mode', () => {
  test('demo dashboard is reachable without a session', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await expect(page.getByText(/demo/i).first()).toBeVisible();
    // Assert on the fixture itself, not just on chrome that renders during the
    // loading state too — this is what proves the demo data reached the UI.
    await expect(page.getByText('Demo · World ETF')).toBeVisible();
    await expect(page.getByText(/42[.,\s]?000/).first()).toBeVisible();
  });

  test('the demo renders server-side, before hydration', async ({ page }) => {
    // Shareable demo links are the point of the feature, so the fixture has to
    // be in the SSR response rather than appear only after hydration.
    const response = await page.request.get('/dashboard?demo=1');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Demo · World ETF');
  });

  test('selecting a single portfolio updates the demo total', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await page.locator('html[data-hydrated]').waitFor();
    await expect(page.getByText(/42[.,\s]?000/).first()).toBeVisible();

    await page.getByRole('button', { name: /Demo · World ETF/ }).click();

    // Deselecting one of the two portfolios has to move the headline number;
    // inert pills would read as a broken product to a first-time visitor.
    await expect(page.getByText(/42[.,\s]?000/)).toHaveCount(0);
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
