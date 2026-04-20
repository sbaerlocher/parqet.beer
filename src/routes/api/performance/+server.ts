// SPDX-License-Identifier: MIT
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { getPerformance, getPortfolios, ParqetAuthError } from '$lib/server/parqet-client';
import { getCached } from '$lib/server/kv-cache';
import { clearSessionCookie, clearUserKv } from '$lib/server/auth';

// Parqet portfolio IDs are short opaque strings; cap to avoid abuse.
const PortfolioIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
const PortfolioIdListSchema = z.array(PortfolioIdSchema).max(50);

export const GET: RequestHandler = async ({ locals, platform, url, cookies }) => {
  if (!locals.session) error(401, 'Unauthorized');

  const env = platform!.env;
  const { userId, accessToken } = locals.session;

  const rawIds = url.searchParams.getAll('portfolioId');
  const parsedIds = PortfolioIdListSchema.safeParse(rawIds);
  if (!parsedIds.success) {
    error(400, 'Invalid portfolioId parameter');
  }
  const portfolioIds = parsedIds.data;

  if (portfolioIds.length === 0) {
    return json({ totalValue: 0, dividends: 0, currency: 'EUR' });
  }

  try {
    // Get portfolios to determine currency
    const allPortfolios = await getCached(env.PARQET_KV, `portfolios:${userId}`, 3600, () =>
      getPortfolios(env.PARQET_API_URL, accessToken)
    );

    const selectedPortfolios = (allPortfolios ?? []).filter((p) => portfolioIds.includes(p.id));

    // Mixed-currency selections fall back to the first portfolio's currency.
    // The dashboard shows a banner when that happens; `getPerformance` then
    // normalises every holding into that single currency via
    // `holdingValueInCurrency`, so the total stays consistent.
    const currency = selectedPortfolios[0]?.currency ?? 'EUR';

    // Cache key includes selected portfolio IDs
    const cacheKey = `performance:${userId}:${portfolioIds.sort().join(',')}`;

    const performance = await getCached(
      env.PARQET_KV,
      cacheKey,
      900, // 15min
      () => getPerformance(env.PARQET_API_URL, accessToken, portfolioIds, currency)
    );

    return json({
      totalValue: performance?.totalValue ?? 0,
      dividends: performance?.dividends ?? 0,
      currency,
    });
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
