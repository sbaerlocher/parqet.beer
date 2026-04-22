import { test, expect } from '@playwright/test';

test.describe('parqet.beer smoke', () => {
  test('landing page renders with connect button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Target the CTA by `data-testid` — the href is dynamic (flips between
    // `/api/auth/login` and `/dashboard` depending on session state) and the
    // label varies by locale.
    await expect(page.getByTestId('hero-cta')).toBeVisible();
  });

  test('landing page exposes OG meta tags', async ({ page }) => {
    await page.goto('/');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /og-image\.png$/);
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
  });

  test('unknown route renders the custom error page', async ({ page }) => {
    const response = await page.goto('/this-page-definitely-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('link', { name: /home|startseite/i })).toBeVisible();
  });

  test('privacy page is reachable', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('locale toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    // Svelte 5 attaches `onclick` handlers during hydration, which completes
    // after the `load` event Playwright waits for. Clicking before hydration
    // is a silent no-op. `html[data-hydrated]` is set by a client-only
    // `$effect` in +layout.svelte, so waiting on it guarantees handlers are
    // live before we interact.
    await page.locator('html[data-hydrated]').waitFor();
    await page.getByRole('button', { name: 'EN' }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('locale'))).toBe('en');
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem('locale'));
    expect(stored).toBe('en');
  });
});
