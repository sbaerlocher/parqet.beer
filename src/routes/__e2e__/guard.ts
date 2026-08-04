// SPDX-License-Identifier: MIT
import { error } from '@sveltejs/kit';

/**
 * Every route under `src/routes/__e2e__/` must call this first.
 *
 * These routes hand out access tokens and user identities to whoever asks —
 * they exist only so Playwright can drive the OAuth flow without reaching
 * `connect.parqet.com`. Outside the e2e environment they must not exist at
 * all, so the guard throws 404 rather than 403: a 403 would confirm the
 * endpoint is there.
 *
 * `ENVIRONMENT` is set to `"e2e"` exclusively by the `env.e2e` block in
 * `wrangler.jsonc`, which is never deployed. `development`, `preview` and
 * `production` all carry a different value, and a request with no platform
 * bindings at all (`vite dev`, unit tests) fails the check too.
 */
export function assertE2e(platform: App.Platform | undefined): void {
  if (platform?.env?.ENVIRONMENT !== 'e2e') {
    error(404, 'Not Found');
  }
}
