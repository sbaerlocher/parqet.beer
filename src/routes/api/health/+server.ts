import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Deterministic health probe — no auth, no KV, no upstream calls.
// Used by uptime monitors and the e2e smoke suite.
export const GET: RequestHandler = () => {
  return json({ status: 'ok', timestamp: new Date().toISOString() });
};
