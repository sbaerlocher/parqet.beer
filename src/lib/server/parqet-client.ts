// SPDX-License-Identifier: MIT
import { z } from 'zod';
import { convert, type FxRates } from '../fx';

/**
 * Thrown when Parqet rejects a request with HTTP 401 — the stored access
 * token is no longer valid (expired, revoked by the user in the Parqet
 * Connect settings, or the underlying OAuth grant was deleted). Route
 * handlers catch this specifically so they can clear the cached user data,
 * drop the session cookie, and send the browser back through the login
 * flow, rather than silently rendering zero/empty values.
 */
export class ParqetAuthError extends Error {
  constructor(message = 'Parqet access token rejected') {
    super(message);
    this.name = 'ParqetAuthError';
  }
}

const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string(),
});

const UserInfoSchema = z.object({
  userId: z.string(),
  installationId: z.string(),
  state: z.enum(['active', 'deleted']),
  permissions: z.array(
    z.object({
      action: z.string(),
      resourceType: z.string(),
      resourceId: z.string(),
    })
  ),
});

const PortfolioListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      currency: z.string(),
      name: z.string(),
      createdAt: z.string(),
    })
  ),
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type Portfolio = z.infer<typeof PortfolioListSchema>['items'][number];

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  env: App.Platform['env'],
  codeVerifier: string
): Promise<TokenResponse | null> {
  try {
    const response = await fetch(env.PARQET_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: env.PARQET_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return TokenResponseSchema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Exchange a refresh token for a fresh access token. Returns null on any
 * failure so the caller can fall back to re-auth.
 */
export async function refreshAccessToken(
  refreshToken: string,
  env: App.Platform['env']
): Promise<TokenResponse | null> {
  try {
    const response = await fetch(env.PARQET_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: env.PARQET_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      console.error('[parqet:refresh] Token refresh rejected:', response.status);
      return null;
    }

    const data = await response.json();
    return TokenResponseSchema.parse(data);
  } catch (err) {
    console.error('[parqet:refresh] Token refresh error:', err);
    return null;
  }
}

export async function getUserInfo(apiUrl: string, accessToken: string): Promise<UserInfo | null> {
  try {
    const response = await fetch(`${apiUrl}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      throw new ParqetAuthError('getUserInfo: token rejected');
    }
    if (!response.ok) return null;

    const data = await response.json();
    return UserInfoSchema.parse(data);
  } catch (e) {
    if (e instanceof ParqetAuthError) throw e;
    return null;
  }
}

/**
 * Return null on any transient failure so `getCached` treats it as a cache
 * miss and doesn't pin an empty list for the whole TTL window on a blip.
 * Throws `ParqetAuthError` on 401 so callers can distinguish "token dead,
 * force re-auth" from "upstream flaked, try again later."
 */
export async function getPortfolios(
  apiUrl: string,
  accessToken: string
): Promise<Portfolio[] | null> {
  try {
    const response = await fetch(`${apiUrl}/portfolios`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      throw new ParqetAuthError('getPortfolios: token rejected');
    }
    if (!response.ok) return null;

    const data = await response.json();
    const parsed = PortfolioListSchema.parse(data);
    return parsed.items;
  } catch (e) {
    if (e instanceof ParqetAuthError) throw e;
    return null;
  }
}

// --- Performance calculation based on holdings with FX rates ---
// Adapted from automation/w/f/finance/performance__flow
//
// Exported helpers are pure and used by tests — keep them side-effect free.

export interface Holding {
  position?: { currentValue?: number };
  asset?: { type?: string };
}

interface PerformanceResponse {
  performance?: {
    kpis?: { inInterval?: { xirr?: number | null; ttwror?: number | null } } | null;
    dividends?: { inInterval?: { gainGross?: number; gainNet?: number } } | null;
  };
  holdings?: Holding[];
}

/**
 * Currency a holding's `currentValue` is denominated in. Parqet reports
 * securities in EUR regardless of the quote's original currency (the `fx`
 * block describes the quote, not the stored value). Custom assets are the
 * exception: those are stored in the portfolio's own currency.
 */
function holdingSourceCurrency(h: Holding, portfolioCurrency: string): string {
  return h.asset?.type === 'custom' ? portfolioCurrency : 'EUR';
}

export function holdingValueInCurrency(
  h: Holding,
  rates: FxRates,
  targetCurrency: string,
  portfolioCurrency: string
): number {
  const value = h.position?.currentValue ?? 0;
  return convert(value, holdingSourceCurrency(h, portfolioCurrency), targetCurrency, rates);
}

export function computeValuation(
  holdings: Holding[],
  rates: FxRates,
  targetCurrency: string,
  portfolioCurrency: string
): number {
  let total = 0;
  for (const h of holdings) {
    total += holdingValueInCurrency(h, rates, targetCurrency, portfolioCurrency);
  }
  return Math.round(total * 100) / 100;
}

export async function getPerformance(
  apiUrl: string,
  accessToken: string,
  portfolioIds: string[],
  portfolioCurrency: string,
  rates: FxRates
): Promise<{ totalValue: number; dividends: number } | null> {
  try {
    // Two parallel calls: max interval for total value, 1y for annual dividends
    const [maxRes, yearRes] = await Promise.all([
      fetch(`${apiUrl}/performance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioIds,
          interval: { type: 'relative', value: 'max' },
        }),
      }),
      fetch(`${apiUrl}/performance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioIds,
          interval: { type: 'relative', value: '1y' },
        }),
      }),
    ]);

    // A 401 on EITHER call means the token is dead — signal the caller to
    // force re-auth. We check both responses so a revoke mid-flight on the
    // second POST still produces the right signal.
    if (maxRes.status === 401 || yearRes.status === 401) {
      throw new ParqetAuthError('getPerformance: token rejected');
    }

    if (!maxRes.ok) {
      // Only log status — Parqet error bodies may echo request parameters we
      // don't want in aggregated logs.
      console.error('Performance API error:', maxRes.status);
      return null;
    }

    const maxData = (await maxRes.json()) as PerformanceResponse;
    const holdings = maxData.holdings ?? [];

    // Total value from max interval
    const totalValue = computeValuation(holdings, rates, portfolioCurrency, portfolioCurrency);

    // Dividends from 1y interval. Parqet reports them in EUR.
    let dividends = 0;
    if (yearRes.ok) {
      const yearData = (await yearRes.json()) as PerformanceResponse;
      const dividendsEur = yearData.performance?.dividends?.inInterval?.gainGross ?? 0;
      dividends = convert(dividendsEur, 'EUR', portfolioCurrency, rates);
    }

    return { totalValue, dividends: Math.round(dividends * 100) / 100 };
  } catch (e) {
    if (e instanceof ParqetAuthError) throw e;
    console.error('Performance error:', e);
    return null;
  }
}
