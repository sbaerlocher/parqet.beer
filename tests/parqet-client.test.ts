import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refreshAccessToken,
  exchangeCodeForTokens,
  getEurToChfRate,
  holdingValueInCurrency,
  computeValuation,
  getUserInfo,
  getPortfolios,
  getPerformance,
  ParqetAuthError,
  type Holding,
} from '../src/lib/server/parqet-client';
import { EUR_TO_CHF_RATE } from '../src/lib/fx';

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
const chfSecurity = (eurValue: number, rate: number): Holding => ({
  position: { currentValue: eurValue },
  quote: { fx: { originalCurrency: 'CHF', rate } },
});
const customAsset = (value: number): Holding => ({
  position: { currentValue: value },
  asset: { type: 'custom' },
});

describe('getEurToChfRate', () => {
  it('returns the rate from the first CHF-quoted holding', () => {
    const holdings = [eurSecurity(100), chfSecurity(50, 0.92), chfSecurity(200, 0.88)];
    expect(getEurToChfRate(holdings)).toBe(0.92);
  });

  it('falls back to the shared constant when no CHF holding is present', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEurToChfRate([eurSecurity(100)])).toBe(EUR_TO_CHF_RATE);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('skips CHF holdings with invalid rates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const holdings: Holding[] = [
      { quote: { fx: { originalCurrency: 'CHF', rate: 0 } } },
      { quote: { fx: { originalCurrency: 'CHF' } } },
    ];
    expect(getEurToChfRate(holdings)).toBe(EUR_TO_CHF_RATE);
    warnSpy.mockRestore();
  });
});

describe('holdingValueInCurrency', () => {
  // Keep rate explicit so tests don't depend on the fallback constant.
  const rate = 0.95;

  describe('target EUR', () => {
    it('returns the stored EUR value for a plain security', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rate, 'EUR', 'EUR')).toBe(100);
    });

    it('returns the stored EUR value for an FX-quoted security', () => {
      expect(holdingValueInCurrency(chfSecurity(100, rate), rate, 'EUR', 'EUR')).toBe(100);
    });

    it('keeps custom assets in portfolio currency when portfolio is EUR', () => {
      expect(holdingValueInCurrency(customAsset(100), rate, 'EUR', 'EUR')).toBe(100);
    });

    it('converts custom CHF assets back to EUR for an EUR target', () => {
      expect(holdingValueInCurrency(customAsset(100), rate, 'EUR', 'CHF')).toBeCloseTo(
        100 / rate,
        5
      );
    });
  });

  describe('target CHF', () => {
    it('multiplies FX-quoted EUR values by the rate', () => {
      expect(holdingValueInCurrency(chfSecurity(100, rate), rate, 'CHF', 'CHF')).toBeCloseTo(95, 5);
    });

    it('multiplies plain EUR securities by the rate', () => {
      expect(holdingValueInCurrency(eurSecurity(100), rate, 'CHF', 'CHF')).toBeCloseTo(95, 5);
    });

    it('keeps custom assets in portfolio currency when portfolio is CHF', () => {
      expect(holdingValueInCurrency(customAsset(100), rate, 'CHF', 'CHF')).toBe(100);
    });

    it('converts custom EUR assets to CHF when portfolio is EUR', () => {
      expect(holdingValueInCurrency(customAsset(100), rate, 'CHF', 'EUR')).toBeCloseTo(95, 5);
    });
  });

  it('treats missing currentValue as zero', () => {
    expect(holdingValueInCurrency({}, rate, 'EUR', 'EUR')).toBe(0);
  });
});

describe('computeValuation', () => {
  it('sums plain EUR holdings into an EUR total', () => {
    const holdings = [eurSecurity(100), eurSecurity(250.5), eurSecurity(49.5)];
    expect(computeValuation(holdings, 0.95, 'EUR', 'EUR')).toBe(400);
  });

  it('rounds totals to two decimals to avoid floating-point noise', () => {
    const holdings = [eurSecurity(0.1), eurSecurity(0.2)];
    expect(computeValuation(holdings, 0.95, 'EUR', 'EUR')).toBe(0.3);
  });

  it('converts an all-EUR portfolio to CHF using the shared rate', () => {
    const holdings = [eurSecurity(1000)];
    // Consistency check with the FX module — if EUR_TO_CHF_RATE changes, the
    // client display (calculator.ts) and this value stay aligned.
    expect(computeValuation(holdings, EUR_TO_CHF_RATE, 'CHF', 'CHF')).toBeCloseTo(
      1000 * EUR_TO_CHF_RATE,
      2
    );
  });

  it('handles a mixed portfolio with custom assets and FX holdings', () => {
    const rate = 0.9;
    const holdings = [
      eurSecurity(1000), // 1000 EUR
      chfSecurity(500, rate), // currentValue 500 EUR, CHF-original
      customAsset(200), // 200 in portfolio currency (CHF here)
    ];
    // Portfolio is CHF, target CHF:
    //   1000 EUR * 0.9 = 900 CHF
    //   500 EUR  * 0.9 = 450 CHF
    //   200 CHF  kept  = 200 CHF
    //   total           = 1550 CHF
    expect(computeValuation(holdings, rate, 'CHF', 'CHF')).toBeCloseTo(1550, 2);
  });

  it('returns 0 for an empty holdings list', () => {
    expect(computeValuation([], 0.95, 'EUR', 'EUR')).toBe(0);
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
      getPerformance('https://api.example.com', 'dead-token', ['p1'], 'EUR')
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
      getPerformance('https://api.example.com', 'dead-token', ['p1'], 'EUR')
    ).rejects.toBeInstanceOf(ParqetAuthError);
  });

  it('returns null on a non-401 failure of the max call', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('server error', { status: 503 })
    );
    const result = await getPerformance('https://api.example.com', 'any-token', ['p1'], 'EUR');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const result = await getPerformance('https://api.example.com', 'any-token', ['p1'], 'EUR');
    expect(result).toBeNull();
  });
});
