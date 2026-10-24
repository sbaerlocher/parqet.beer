// SPDX-License-Identifier: MIT
import { env } from 'cloudflare:workers';

/**
 * Cloudflare bindings for the current request.
 *
 * `adapter-cloudflare` 8 no longer populates `event.platform`; bindings are
 * only reachable through the `cloudflare:workers` module, which the adapter
 * also wires to wrangler's platform proxy under `vite dev`. Wrapping them in
 * the old `App.Platform` shape keeps every consumer (`requireAuthEnv`,
 * `assertE2e`, the route handlers) unchanged.
 */
export function getPlatform(): App.Platform {
  return { env: env as unknown as App.Platform['env'] };
}
