import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'https://localhost:4173',
    // `wrangler dev --local-protocol https` serves a self-signed certificate;
    // no browser or CI runner trusts it out of the box.
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  webServer: {
    // Run the built worker, not `vite dev`, so the suite gets real Cloudflare
    // bindings: `hooks.server.ts` only runs auth logic when both `PARQET_KV`
    // and `SESSION_SECRET` are present, and those come from `env.e2e` in
    // `wrangler.jsonc`. HTTPS is equally load-bearing — every OAuth cookie
    // carries the `__Host-` prefix, which implies `Secure`, and browsers drop
    // `Secure` cookies served over plain HTTP.
    //
    // `pnpm build` runs first because `wrangler dev` reads the bundle from
    // `.svelte-kit/cloudflare`. That makes each e2e run slower than the old
    // `vite dev` boot; it is the price of testing the artifact that actually
    // ships. CI runs the same command, so there is no config path that only
    // ever executes on one of the two.
    //
    // `url` (not `port`) is used so Playwright waits for the server to serve
    // a real 200 response before starting tests. adapter-cloudflare's
    // platform-proxy cache has a race that serves 500s for the first wave of
    // concurrent requests; warming on /api/health (the one route that hits
    // the full server pipeline but has no external deps) forces the cache to
    // resolve serially before the suite fans out.
    command:
      'pnpm build && pnpm exec wrangler dev --env e2e --local-protocol https --port 4173 --ip 127.0.0.1',
    url: 'https://localhost:4173/api/health',
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
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
