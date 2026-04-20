import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    // Use `vite dev` (not `wrangler pages dev`) so tests don't need Cloudflare
    // bindings. `@sveltejs/adapter-cloudflare` still emulates `platform.env`
    // via Miniflare under the hood; `hooks.server.ts` treats the request as
    // anonymous whenever `PARQET_KV`/`SESSION_SECRET` are missing, so public
    // routes (landing, privacy, 404, /api/health) render normally.
    //
    // `url` (not `port`) is used so Playwright waits for the server to serve
    // a real 200 response before starting tests. adapter-cloudflare's
    // platform-proxy cache has a race that serves 500s for the first wave of
    // concurrent requests; warming on /api/health (the one route that hits
    // the full server pipeline but has no external deps) forces the cache to
    // resolve serially before the suite fans out.
    command: 'pnpm exec vite dev --port 4173 --strictPort',
    url: 'http://localhost:4173/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
