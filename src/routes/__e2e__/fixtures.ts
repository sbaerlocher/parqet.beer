// SPDX-License-Identifier: MIT
/**
 * Shared constants for the e2e mock routes. Separate module because
 * SvelteKit only allows request handlers to be exported from `+server.ts`.
 */

/** Fixed identity for the whole suite — KV keys derive from it. */
export const E2E_USER_ID = 'e2e-user-1';
