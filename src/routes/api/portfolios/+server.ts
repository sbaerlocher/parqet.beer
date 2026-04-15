import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPortfolios, ParqetAuthError } from '$lib/server/parqet-client';
import { getCached } from '$lib/server/kv-cache';
import { clearSessionCookie, clearUserKv } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals, platform, cookies, url }) => {
  if (!locals.session) error(401, 'Unauthorized');

  const env = platform!.env;
  const { userId, accessToken } = locals.session;

  // `?fresh=1` bypasses the KV cache so the dashboard can perform a
  // session-liveness probe on mount — otherwise a revoked token wouldn't
  // surface until the cache TTL expires and the user would see stale
  // portfolios for up to an hour after disconnecting the integration.
  const skipCache = url.searchParams.get('fresh') === '1';

  try {
    const portfolios = skipCache
      ? await getPortfolios(env.PARQET_API_URL, accessToken)
      : await getCached(env.PARQET_KV, `portfolios:${userId}`, 3600, () =>
          getPortfolios(env.PARQET_API_URL, accessToken)
        );

    return json(portfolios ?? []);
  } catch (e) {
    if (e instanceof ParqetAuthError) {
      // Parqet rejected the token — the user revoked the integration (or the
      // grant was administratively removed). Drop all cached per-user data,
      // clear the session cookie, and tell the browser to re-authenticate.
      await clearUserKv(env.PARQET_KV, userId);
      clearSessionCookie(cookies);
      error(401, 'Parqet session ended — please reconnect');
    }
    throw e;
  }
};
