import { execFileSync } from 'node:child_process';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * Date of the last commit touching the beverage price data, as `YYYY-MM-DD`.
 *
 * Surfaced in the dashboard as the "Stand vom" / "As of" tag so visitors can
 * judge how current the prices are. Returns `''` when git isn't available
 * (tarball build, shallow clone without history) — `data-freshness.ts` treats
 * that as "unknown" and hides the tag rather than showing a broken date.
 */
function dataUpdatedAt(): string {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', 'src/lib/data'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: {
    __DATA_UPDATED_AT__: JSON.stringify(dataUpdatedAt()),
  },
  server: {
    allowedHosts: ['parqet-beer.test'],
  },
});
