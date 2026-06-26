import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    files: {
      errorTemplate: 'src/error.html',
    },
    // SvelteKit computes SHA-256 hashes for every inline <script>/<style> it
    // emits (hydration bootstrap + the theme-detection script in `app.html`)
    // and injects a `<meta http-equiv="Content-Security-Policy">` tag per
    // rendered page. This is the only practical way to cover SvelteKit's
    // build-hashed hydration script whose content changes every deploy.
    //
    // `frame-ancestors` can't live in a meta CSP (spec); it stays in the
    // HTTP-header CSP applied by `src/lib/server/security-headers.ts`.
    csp: {
      mode: 'hash',
      directives: {
        // `static.cloudflareinsights.com` serves the Web Analytics beacon
        // (see src/lib/components/Analytics.svelte); `cloudflareinsights.com`
        // is where the cookieless beacon POSTs pageviews. Both are listed
        // unconditionally — harmless when no beacon token is set, since the
        // script tag is only emitted then.
        'default-src': ['self'],
        'script-src': ['self', 'https://static.cloudflareinsights.com'],
        'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
        'img-src': ['self', 'data:', 'https:'],
        'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
        'connect-src': ['self', 'https://connect.parqet.com', 'https://cloudflareinsights.com'],
        'base-uri': ['self'],
        'form-action': ['self', 'https://connect.parqet.com'],
        'upgrade-insecure-requests': true,
      },
    },
  },
};

export default config;
