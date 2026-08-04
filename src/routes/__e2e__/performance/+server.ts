// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';

/**
 * Stand-in for Parqet's `/performance`. POST, and `getPerformance` fires two
 * of them in parallel (`max` and `1y`) — this handler is stateless, so the
 * concurrency is irrelevant.
 *
 * One CHF-quoted holding is included so `getEurToChfRate` derives a rate from
 * the payload instead of falling back to the hardcoded constant and logging a
 * warning on every dashboard load.
 */
export const POST: RequestHandler = async ({ platform }) => {
  assertE2e(platform);

  return json({
    performance: {
      kpis: { inInterval: { xirr: 0.05, ttwror: 0.07 } },
      dividends: { inInterval: { gainGross: 120, gainNet: 100 } },
    },
    holdings: [
      {
        position: { currentValue: 1000 },
        quote: { fx: { rate: 0.95, originalCurrency: 'CHF' } },
        asset: { type: 'security' },
      },
    ],
  });
};
