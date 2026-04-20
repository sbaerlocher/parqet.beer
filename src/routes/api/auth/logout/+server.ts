// SPDX-License-Identifier: MIT
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSessionCookie, clearUserKv } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, platform, locals, request, url }) => {
  // Defence in depth on top of SvelteKit's built-in form-POST CSRF check.
  // Browsers send `Origin` on cross-origin POSTs, so mismatches are a clear
  // signal to block. If the header is absent we fall through — modern
  // browsers send it reliably for POST and SvelteKit's Content-Type guard
  // still applies.
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    error(403, 'Forbidden');
  }

  const env = platform?.env;
  if (env && locals.session) {
    await clearUserKv(env.PARQET_KV, locals.session.userId);
  }

  clearSessionCookie(cookies);
  redirect(303, '/');
};
