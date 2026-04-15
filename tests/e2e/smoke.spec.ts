import { test, expect } from '@playwright/test';

test.describe('parqet.beer smoke', () => {
  test('landing page renders with connect button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /parqet\.beer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Parqet/i })).toBeVisible();
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
    // Switch to EN.
    await page.getByRole('button', { name: 'EN' }).click();
    await page.reload();
    // The store should have picked up 'en' from localStorage.
    const stored = await page.evaluate(() => localStorage.getItem('locale'));
    expect(stored).toBe('en');
  });
});
