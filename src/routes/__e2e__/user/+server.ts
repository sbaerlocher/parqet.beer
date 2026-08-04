// SPDX-License-Identifier: MIT
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertE2e } from '../guard';
import { E2E_USER_ID } from '../fixtures';

/**
 * Stand-in for Parqet's `/user`.
 *
 * The payload must satisfy `UserInfoSchema` in full (`userId`,
 * `installationId`, `state`, `permissions`); a partial object makes Zod throw
 * inside `getUserInfo`, which returns null and turns into a confusing
 * "Failed to fetch user info" 500 with no hint that the mock was at fault.
 */
export const GET: RequestHandler = async ({ platform, request }) => {
  assertE2e(platform);

  // The failure marker rides in the token minted by `../token`.
  if (request.headers.get('Authorization')?.includes('fail-user')) {
    return json({ error: 'server_error' }, { status: 500 });
  }

  return json({
    userId: E2E_USER_ID,
    installationId: 'e2e-installation-1',
    state: 'active',
    permissions: [{ action: 'read', resourceType: 'portfolio', resourceId: 'e2e-portfolio-1' }],
  });
};
