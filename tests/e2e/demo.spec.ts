import { test, expect } from '@playwright/test';

test.describe('demo mode', () => {
  test('demo dashboard is reachable without a session', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await expect(page.getByText(/demo/i).first()).toBeVisible();
    // Assert on the fixture itself, not just on chrome that renders during the
    // loading state too — this is what proves the demo data reached the UI. The
    // selector pill carries the name on every viewport; the header value chip
    // is `hidden sm:inline-flex` and would fail on mobile.
    await expect(page.getByRole('button', { name: /Demo · World ETF/ })).toBeVisible();
  });

  test('the demo renders server-side, before hydration', async ({ page }) => {
    // Shareable demo links are the point of the feature, so the fixture has to
    // be in the SSR response rather than appear only after hydration.
    const response = await page.request.get('/dashboard?demo=1');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Demo · World ETF');
  });

  test('deselecting a portfolio recomputes the demo total', async ({ page }) => {
    await page.goto('/dashboard?demo=1');
    await page.locator('html[data-hydrated]').waitFor();

    // The pill's own ●/○ marker tracks `selectedIds`, so it is both precise and
    // locale- and viewport-independent — unlike the header value chip, which is
    // `hidden sm:inline-flex`.
    const worldPill = page.getByRole('button', { name: /Demo · World ETF/ });
    await expect(worldPill).toContainText('●');

    // The value also renders in the header chip, but that one is
    // `hidden sm:inline-flex` and invisible on the mobile project. The ticket
    // footer carries it on every viewport, so scope the assertions there.
    const total = page.getByTestId('demo-total');
    await expect(total).toContainText(/42[.,]000/);

    await worldPill.click();
    await expect(worldPill).toContainText('○');

    // Assert on a number only `demoTotals` can produce: dropping demo-world
    // leaves demo-dividend's 10,500 EUR. The pill marker and the selection
    // label both flip on `selectedIds` alone, so neither would catch a
    // regression that skips the recompute.
    await expect(total).toContainText(/10[.,]500/);
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
