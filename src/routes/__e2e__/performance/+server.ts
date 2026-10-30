// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';

/**
 * Stand-in for Parqet's `/performance`. POST, and `getPerformance` fires two
 * of them in parallel (`max` and `1y`) — this handler is stateless, so the
 * concurrency is irrelevant.
 */
export const POST: RequestHandler = async () => {
  assertE2e();

  return json({
    performance: {
      kpis: { inInterval: { xirr: 0.05, ttwror: 0.07 } },
      dividends: { inInterval: { gainGross: 120, gainNet: 100 } },
    },
    holdings: [
      {
        position: { currentValue: 1000 },
        asset: { type: 'security' },
      },
    ],
  });
};
