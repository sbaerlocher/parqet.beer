// SPDX-License-Identifier: MIT
// Vitest stand-in for the `cloudflare:workers` module, which only exists on
// the Workers runtime and under adapter-cloudflare's Vite plugin. Tests swap
// the bindings per case through `setEnv`.
export const env: Record<string, unknown> = {};

export function setEnv(next: Record<string, unknown> = {}): void {
  for (const key of Object.keys(env)) delete env[key];
  Object.assign(env, next);
}
