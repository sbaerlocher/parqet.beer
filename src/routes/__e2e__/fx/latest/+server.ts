// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../../guard';

/**
 * Stand-in for Frankfurter's `/latest`, so e2e runs never reach the real API
 * and always see the same rates. Shape must satisfy
 * `FrankfurterResponseSchema` in `#lib/server/fx-service`.
 */
export const GET: RequestHandler = async () => {
  assertE2e();

  return json({
    base: 'EUR',
    rates: { CHF: 0.95, USD: 1.08, GBP: 0.85 },
  });
};
