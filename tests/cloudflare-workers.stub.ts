// SPDX-License-Identifier: MIT
/**
 * Stand-in for the `cloudflare:workers` module, which only exists inside
 * workerd. `vitest.config.ts` aliases it here; tests set the bindings a
 * request should see via `setEnv`.
 */
export const env: Record<string, unknown> = {};

export function setEnv(next: Record<string, unknown> = {}): void {
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, next);
}
