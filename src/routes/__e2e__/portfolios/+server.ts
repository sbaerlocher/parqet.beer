// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';

/**
 * Stand-in for Parqet's `/portfolios`. Not part of the OAuth flow, but the
 * dashboard fetches it client-side right after login
 * (`dashboard/+page.svelte`), so without it the post-login page sits in a
 * permanent loading state and drags every assertion out to its timeout.
 *
 * Shape must satisfy `PortfolioListSchema` in `$lib/server/parqet-client`.
 */
export const GET: RequestHandler = async ({ platform }) => {
  assertE2e(platform);

  return json({
    items: [
      {
        id: 'e2e-portfolio-1',
        currency: 'CHF',
        name: 'E2E Portfolio',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  });
};
