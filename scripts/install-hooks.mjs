#!/usr/bin/env node
// Git hook installer — runs via the `prepare` lifecycle after install.
//
// Skips cleanly when lefthook isn't on disk (e.g. `pnpm install --prod` in
// CI/Docker, where devDependencies aren't materialized) so the missing dev
// dep doesn't break production installs. Real failures from `lefthook
// install` itself are propagated as a non-zero exit so they can't hide.
//
// The bin path is resolved from lefthook's own package.json rather than
// relying on `node_modules/.bin` being in PATH — that way the script works
// both inside a pnpm lifecycle (where PATH is set) and when invoked
// directly by a developer.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

let pkgPath;
let pkg;
try {
  pkgPath = require.resolve('lefthook/package.json');
  pkg = require('lefthook/package.json');
} catch {
  // lefthook not installed — nothing to wire up, succeed silently.
  process.exit(0);
}

const binField = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.lefthook;
if (!binField) {
  console.error('[install-hooks] lefthook package.json has no `bin.lefthook` entry');
  process.exit(1);
}

const lefthookBin = resolve(dirname(pkgPath), binField);
const result = spawnSync(process.execPath, [lefthookBin, 'install'], {
  stdio: 'inherit',
  shell: false,
});
if (result.error) {
  console.error(`[install-hooks] failed to spawn lefthook: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
