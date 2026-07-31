import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refreshAccessToken,
  exchangeCodeForTokens,
  holdingValueInCurrency,
  computeValuation,
  getUserInfo,
  getPortfolios,
  getPerformance,
  ParqetAuthError,
  type Holding,
} from '../src/lib/server/parqet-client';
import { FX_FALLBACK, type FxRates } from '../src/lib/fx';

const env = {
  PARQET_CLIENT_ID: 'test-client',
  PARQET_TOKEN_URL: 'https://oauth.example.com/token',
} as App.Platform['env'];

describe('refreshAccessToken', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('posts the refresh grant and returns parsed tokens', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
        { status: 200 }
      )
    );

    const result = await refreshAccessToken('old-refresh', env);

    expect(result).toEqual({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[0]).toBe('https://oauth.example.com/token');
    expect(call[1].method).toBe('POST');
    const body = new URLSearchParams(call[1].body as string);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('old-refresh');
    expect(body.get('client_id')).toBe('test-client');
  });

  it('returns null on a non-ok HTTP response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('nope', { status: 401 })
    );
    const result = await refreshAccessToken('bad-refresh', env);
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const result = await refreshAccessToken('any', env);
    expect(result).toBeNull();
  });

  it('returns null when the response does not match the schema', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ wrong: 'shape' }), { status: 200 })
    );
    const result = await refreshAccessToken('any', env);
    expect(result).toBeNull();
  });
});

describe('exchangeCodeForTokens', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('posts the authorization_code grant with PKCE verifier and returns tokens', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'fresh-access',
          refresh_token: 'fresh-refresh',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
        { status: 200 }
      )
    );

    const result = await exchangeCodeForTokens(
      'auth-code',
      'https://app.example.com/api/auth/callback',
      env,
      'pkce-verifier'
    );

    expect(result).toEqual({
      access_token: 'fresh-access',
      refresh_token: 'fresh-refresh',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(call[0]).toBe('https://oauth.example.com/token');
    expect(call[1].method).toBe('POST');
    expect(call[1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const body = new URLSearchParams(call[1].body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code');
    expect(body.get('redirect_uri')).toBe('https://app.example.com/api/auth/callback');
    expect(body.get('client_id')).toBe('test-client');
    expect(body.get('code_verifier')).toBe('pkce-verifier');
  });

  it('returns null on a non-ok HTTP response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('invalid_grant', { status: 400 })
    );
    const result = await exchangeCodeForTokens('bad', 'https://x', env, 'v');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const result = await exchangeCodeForTokens('any', 'https://x', env, 'v');
    expect(result).toBeNull();
  });

  it('returns null when the response shape is invalid', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'a' /* missing fields */ }), { status: 200 })
    );
    const result = await exchangeCodeForTokens('any', 'https://x', env, 'v');
    expect(result).toBeNull();
  });
});

// Helpers: build holdings cheaply so tests stay readable.
const eurSecurity = (value: number): Holding => ({
  position: { currentValue: value },
});
const customAsset = (value: number): Holding => ({
  position: { currentValue: value },
  asset: { type: 'custom' },
});

// Keep rates explicit so valuation tests don't depend on the fallback values.
const rates: FxRates = { EUR: 1, CHF: 0.95, USD: 1.25, GBP: 0.8 };

describe('holdingValueInCurrency', () => {
  describe('target EUR', () => {
    it('returns the stored EUR value for a plain security', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rates, 'EUR', 'EUR')).toBe(100);
    });

    it('keeps custom assets in portfolio currency when portfolio is EUR', () => {
      expect(holdingValueInCurrency(customAsset(100), rates, 'EUR', 'EUR')).toBe(100);
    });

    it('converts custom CHF assets back to EUR for an EUR target', () => {
      expect(holdingValueInCurrency(customAsset(100), rates, 'EUR', 'CHF')).toBeCloseTo(
        100 / rates.CHF,
        5
      );
    });
  });

  describe('target CHF', () => {
    it('multiplies plain EUR securities by the rate', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rates, 'CHF', 'CHF')).toBeCloseTo(95, 5);
    });

    it('keeps custom assets in portfolio currency when portfolio is CHF', () => {
      expect(holdingValueInCurrency(customAsset(100), rates, 'CHF', 'CHF')).toBe(100);
    });

    it('converts custom EUR assets to CHF when portfolio is EUR', () => {
      expect(holdingValueInCurrency(customAsset(100), rates, 'CHF', 'EUR')).toBeCloseTo(95, 5);
    });
  });

  describe('target USD and GBP', () => {
    it('converts EUR securities into USD', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rates, 'USD', 'EUR')).toBeCloseTo(125, 5);
    });

    it('converts EUR securities into GBP', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rates, 'GBP', 'EUR')).toBeCloseTo(80, 5);
    });

    it('converts custom assets between two non-EUR currencies via the EUR pivot', () => {
      // 125 USD → 100 EUR → 80 GBP
      expect(holdingValueInCurrency(customAsset(125), rates, 'GBP', 'USD')).toBeCloseTo(80, 5);
    });
  });

  it('treats missing currentValue as zero', () => {
    expect(holdingValueInCurrency({}, rates, 'EUR', 'EUR')).toBe(0);
  });
});

describe('computeValuation', () => {
  it('sums plain EUR holdings into an EUR total', () => {
    const holdings = [eurSecurity(100), eurSecurity(250.5), eurSecurity(49.5)];
    expect(computeValuation(holdings, rates, 'EUR', 'EUR')).toBe(400);
  });

  it('rounds totals to two decimals to avoid floating-point noise', () => {
    const holdings = [eurSecurity(0.1), eurSecurity(0.2)];
    expect(computeValuation(holdings, rates, 'EUR', 'EUR')).toBe(0.3);
  });

  it('converts an all-EUR portfolio to CHF using the supplied rates', () => {
    const holdings = [eurSecurity(1000)];
    expect(computeValuation(holdings, rates, 'CHF', 'CHF')).toBeCloseTo(1000 * rates.CHF, 2);
  });

  it('stays aligned with the client-side fallback rates', () => {
    // Consistency check with the FX module — server valuation and client
    // display (calculator.ts) share the same rate source.
    expect(computeValuation([eurSecurity(1000)], FX_FALLBACK, 'CHF', 'CHF')).toBeCloseTo(
      1000 * FX_FALLBACK.CHF,
      2
    );
  });

  it('handles a mixed portfolio of securities and custom assets', () => {
    const holdings = [
      eurSecurity(1000), // 1000 EUR
      eurSecurity(500), // 500 EUR
      customAsset(200), // 200 in portfolio currency (CHF here)
    ];
    // Portfolio is CHF, target CHF:
    //   1000 EUR * 0.95 = 950 CHF
    //   500 EUR  * 0.95 = 475 CHF
    //   200 CHF  kept   = 200 CHF
    //   total            = 1625 CHF
    expect(computeValuation(holdings, rates, 'CHF', 'CHF')).toBeCloseTo(1625, 2);
  });

  it('returns 0 for an empty holdings list', () => {
    expect(computeValuation([], rates, 'EUR', 'EUR')).toBe(0);
  });
});

// The 401-propagation tests below cover the "user revoked the integration
// in Parqet Connect" path. Before these were added, a 401 silently mapped
// to `null`, which the route handlers rendered as `{totalValue: 0}` and
// users saw "0 beers" instead of a re-auth redirect. The contract now is:
// 401 -> throw ParqetAuthError; anything else non-ok -> return null.
describe('getUserInfo 401 handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws ParqetAuthError on 401', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('unauthorized', { status: 401 })
    );
    await expect(getUserInfo('https://api.example.com', 'dead-token')).rejects.toBeInstanceOf(
      ParqetAuthError
    );
  });

  it('returns null on other non-ok responses', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('server error', { status: 500 })
    );
    const result = await getUserInfo('https://api.example.com', 'any-token');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const result = await getUserInfo('https://api.example.com', 'any-token');
    expect(result).toBeNull();
  });
});

describe('getPortfolios 401 handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws ParqetAuthError on 401', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('unauthorized', { status: 401 })
    );
    await expect(getPortfolios('https://api.example.com', 'dead-token')).rejects.toBeInstanceOf(
      ParqetAuthError
    );
  });

  it('returns null on other non-ok responses', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('server error', { status: 503 })
    );
    const result = await getPortfolios('https://api.example.com', 'any-token');
    expect(result).toBeNull();
  });

  it('returns null when the response schema is invalid', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ wrong: 'shape' }), { status: 200 })
    );
    const result = await getPortfolios('https://api.example.com', 'any-token');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const result = await getPortfolios('https://api.example.com', 'any-token');
    expect(result).toBeNull();
  });
});

describe('getPerformance 401 handling', () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    // Tests below deliberately trigger the non-401 error branch which logs
    // to `console.error`. Silence it so the test output stays clean.
    console.error = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  });

  it('throws ParqetAuthError when the max-interval call returns 401', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response('unauthorized', { status: 401 }))
    );
    await expect(
      getPerformance('https://api.example.com', 'dead-token', ['p1'], 'EUR', rates)
    ).rejects.toBeInstanceOf(ParqetAuthError);
  });

  it('throws ParqetAuthError when only the year-interval call returns 401', async () => {
    // Two parallel requests: first (max) 200, second (year) 401. A revoke
    // that races the dual-call should still surface as an auth error.
    const call = vi.fn();
    (globalThis.fetch as ReturnType<typeof vi.fn>) = call;
    call
      .mockResolvedValueOnce(new Response(JSON.stringify({ holdings: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }));

    await expect(
      getPerformance('https://api.example.com', 'dead-token', ['p1'], 'EUR', rates)
    ).rejects.toBeInstanceOf(ParqetAuthError);
  });

  it('returns null on a non-401 failure of the max call', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('server error', { status: 503 })
    );
    const result = await getPerformance(
      'https://api.example.com',
      'any-token',
      ['p1'],
      'EUR',
      rates
    );
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const result = await getPerformance(
      'https://api.example.com',
      'any-token',
      ['p1'],
      'EUR',
      rates
    );
    expect(result).toBeNull();
  });
});
