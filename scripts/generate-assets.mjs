#!/usr/bin/env node
// Generates raster derivatives (PNG) from SVG sources in static/.
// Run once when source SVGs change: `node scripts/generate-assets.mjs`
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir = resolve(__dirname, '..', 'static');

function render(svgPath, outPath, width) {
  const svg = readFileSync(resolve(staticDir, svgPath), 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const png = resvg.render().asPng();
  writeFileSync(resolve(staticDir, outPath), png);
  console.log(`✓ ${outPath} (${width}px)`);
}

render('favicon.svg', 'favicon-32.png', 32);
render('favicon.svg', 'favicon-192.png', 192);
render('favicon.svg', 'favicon-256.png', 256);
render('favicon.svg', 'apple-touch-icon.png', 180);
render('og-image.svg', 'og-image.png', 1200);

console.log('Done.');
