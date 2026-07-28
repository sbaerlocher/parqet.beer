import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Anchored to this config file rather than `process.cwd()` so the pathspec
// below resolves against the repo root no matter where the build is invoked
// from (`vite build --config ...` from another directory would otherwise read
// an unrelated repo, or nothing at all).
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The price files only. `src/lib/data/` also holds `badges.json`,
// `beverages.ts` and `schema.ts` — a schema tweak or badge rename must not
// bump a tag that claims the *prices* are fresh. A new category is one more
// line here.
const PRICE_DATA_FILES = [
  'src/lib/data/beer.json',
  'src/lib/data/coffee.json',
  'src/lib/data/smoothie.json',
  'src/lib/data/whisky.json',
];

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/**
 * Date of the last commit touching the beverage price data, as `YYYY-MM-DD`.
 *
 * Surfaced in the dashboard as the "Stand vom" / "As of" tag so visitors can
 * judge how current the prices are. Returns `''` when the date cannot be
 * established truthfully — `data-freshness.ts` treats that as "unknown" and
 * hides the tag entirely. A wrong-but-plausible date is worse than no tag.
 *
 * Shallow clones need care: git grafts HEAD as a parentless root commit, so a
 * pathspec-filtered `git log` diffs it against the empty tree, matches every
 * tracked file and returns HEAD's date regardless of what HEAD touched. Since
 * `actions/checkout` and the Cloudflare Workers Git integration both clone
 * with depth 1, taking that at face value would stamp the *deploy* date on
 * every deploy. So on a shallow clone we unshallow first (~1s for this repo's
 * history) and only report a date once the repo can answer honestly.
 *
 * A partial `--deepen` is deliberately not used: if the last price change
 * falls outside the deepened window the graft simply moves, and the query
 * returns a wrong-but-plausible date instead of an obvious failure.
 */
function dataUpdatedAt(): string {
  try {
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false') {
      try {
        git(['fetch', '--quiet', '--unshallow']);
      } catch {
        // Offline or no remote (tarball build, detached CI cache). Fall
        // through to the check below, which then reports "unknown".
      }
      // Still grafted — any date we could produce here would be HEAD's, not
      // the data's.
      if (git(['rev-parse', '--is-shallow-repository']) !== 'false') return '';
    }

    return git(['log', '-1', '--format=%cs', '--', ...PRICE_DATA_FILES]);
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
