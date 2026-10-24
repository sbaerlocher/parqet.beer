import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': fileURLToPath(
        new URL('./tests/stubs/cloudflare-workers.ts', import.meta.url)
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Playwright owns tests/e2e — keep Vitest out so it doesn't try to run
    // specs written against @playwright/test.
    exclude: ['node_modules/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.test.ts', 'src/lib/data/**'],
      // Pragmatic floors for the initial OSS release: the suite covers
      // server-side utilities and calculator logic but not Svelte components,
      // which pulls line/statement coverage down even when the business logic
      // is well tested. These numbers are the current floor minus a small
      // buffer — raise them as tests are added (target 70/70/60/70).
      thresholds: {
        lines: 25,
        functions: 60,
        branches: 65,
        statements: 25,
      },
    },
  },
});
