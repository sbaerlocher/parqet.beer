// SPDX-License-Identifier: MIT
/**
 * Security headers applied to every response by `hooks.server.ts`.
 *
 * **CSP split:** the full `default-src`/`script-src`/`style-src` policy lives
 * in `svelte.config.js` under `kit.csp` so SvelteKit can inject per-build
 * SHA-256 hashes for its own hydration bootstrap script (whose content
 * embeds build-hashed asset URLs and therefore changes every deploy) as well
 * as the inline theme-detection script in `src/app.html`. SvelteKit emits
 * those directives as a `<meta http-equiv="Content-Security-Policy">` tag on
 * every rendered HTML page.
 *
 * We keep a minimal HTTP-header CSP here for `frame-ancestors` only, because
 * `<meta>` CSPs are required by spec to ignore that directive. Two CSPs on
 * the same response intersect (both must allow), so listing only
 * `frame-ancestors` at the header level avoids accidentally re-blocking the
 * inline scripts that the meta CSP allowlists.
 */

const CSP_HEADER = "frame-ancestors 'none'";

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP_HEADER,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}
