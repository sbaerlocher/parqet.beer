import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handle } from '../src/hooks.server';
import { createSessionCookie, SESSION_COOKIE } from '../src/lib/server/auth';

const SESSION_SECRET = 'test-secret-at-least-32-characters-long!';

function createFakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    kv: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      list: vi.fn(async () => ({ keys: [], list_complete: true })),
      getWithMetadata: vi.fn(),
    } as unknown as KVNamespace,
  };
}

function createFakeCookies(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    cookies: {
      get: (name: string) => store.get(name),
      getAll: () => Array.from(store.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => {
        store.set(name, value);
      },
      delete: (name: string) => {
        store.delete(name);
      },
      serialize: () => '',
    } as unknown as import('@sveltejs/kit').Cookies,
  };
}

interface BuildEventOpts {
  pathname?: string;
  cookies?: ReturnType<typeof createFakeCookies>;
  kv?: ReturnType<typeof createFakeKv>;
  clientIp?: string;
}

function buildEvent(opts: BuildEventOpts = {}) {
  const url = new URL(`https://app.example.com${opts.pathname ?? '/'}`);
  const cookies = opts.cookies ?? createFakeCookies();
  const kv = opts.kv ?? createFakeKv();
  const env = {
    PARQET_KV: kv.kv,
    SESSION_SECRET,
    PARQET_CLIENT_ID: 'test-client',
    PARQET_TOKEN_URL: 'https://oauth.example.com/token',
    PARQET_AUTHORIZE_URL: 'https://oauth.example.com/authorize',
    PARQET_API_URL: 'https://api.example.com',
    ENVIRONMENT: 'test',
  };

  const event = {
    url,
    request: new Request(url),
    cookies: cookies.cookies,
    locals: {
      session: null as null | { userId: string; accessToken: string },
      locale: 'de' as 'de' | 'en',
    },
    platform: { env },
    getClientAddress: () => opts.clientIp ?? '203.0.113.7',
    fetch: globalThis.fetch,
    params: {},
    route: { id: opts.pathname ?? '/' },
    setHeaders: () => {},
    isDataRequest: false,
    isSubRequest: false,
  };

  return { event, cookies, kv };
}

/** Seed a session cookie + KV token entry for a user. */
async function seedSession(
  cookies: ReturnType<typeof createFakeCookies>,
  kv: ReturnType<typeof createFakeKv>,
  opts: {
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  }
) {
  const cookieValue = await createSessionCookie(opts.userId, SESSION_SECRET);
  cookies.store.set(SESSION_COOKIE, cookieValue);

  const tokenData = JSON.stringify({
    accessToken: opts.accessToken,
    refreshToken: opts.refreshToken,
    expiresAt: opts.expiresAt,
  });
  kv.store.set(`token:${opts.userId}`, tokenData);

  return cookieValue;
}

const fakeResolve = vi.fn(async () => new Response('ok', { status: 200 }));

async function runHandle(event: ReturnType<typeof buildEvent>['event']) {
  // Cast loosely — handle only touches the subset we provide.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return handle({ event: event as any, resolve: fakeResolve });
}

beforeEach(() => {
  fakeResolve.mockClear();
});

describe('hooks.server handle()', () => {
  describe('no session cookie', () => {
    it('sets locals.session to null and resolves', async () => {
      const ctx = buildEvent({ pathname: '/' });
      const res = await runHandle(ctx.event);
      expect(res.status).toBe(200);
      expect(ctx.event.locals.session).toBeNull();
      expect(fakeResolve).toHaveBeenCalledOnce();
    });
  });

  describe('locale resolution', () => {
    it('defaults to "de" when no cookie is present', async () => {
      const ctx = buildEvent({ pathname: '/' });
      await runHandle(ctx.event);
      expect(ctx.event.locals.locale).toBe('de');
    });

    it('respects a supported locale cookie', async () => {
      const cookies = createFakeCookies({ locale: 'en' });
      const ctx = buildEvent({ pathname: '/', cookies });
      await runHandle(ctx.event);
      expect(ctx.event.locals.locale).toBe('en');
    });

    it('falls back to "de" when the cookie holds an unsupported value', async () => {
      const cookies = createFakeCookies({ locale: 'fr' });
      const ctx = buildEvent({ pathname: '/', cookies });
      await runHandle(ctx.event);
      expect(ctx.event.locals.locale).toBe('de');
    });

    it('falls back to "de" when the cookie is empty', async () => {
      const cookies = createFakeCookies({ locale: '' });
      const ctx = buildEvent({ pathname: '/', cookies });
      await runHandle(ctx.event);
      expect(ctx.event.locals.locale).toBe('de');
    });
  });

  describe('valid session, far from expiry', () => {
    it('populates locals.session from cookie + KV and does not refresh', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      await seedSession(cookies, kv, {
        userId: 'user-1',
        accessToken: 'access-current',
        refreshToken: 'refresh-current',
        expiresAt: Date.now() + 60 * 60 * 1000, // 1h ahead, well outside skew
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const ctx = buildEvent({ pathname: '/', cookies, kv });
      await runHandle(ctx.event);

      expect(ctx.event.locals.session).toEqual({
        userId: 'user-1',
        accessToken: 'access-current',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('cookie exists but tokens missing from KV', () => {
    it('sets locals.session to null', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      // Set cookie but do NOT seed KV tokens
      const cookieValue = await createSessionCookie('user-orphan', SESSION_SECRET);
      cookies.store.set(SESSION_COOKIE, cookieValue);

      const ctx = buildEvent({ pathname: '/', cookies, kv });
      await runHandle(ctx.event);

      expect(ctx.event.locals.session).toBeNull();
    });
  });

  describe('session near expiry → refresh', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('refreshes the access token and writes new tokens to KV', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      await seedSession(cookies, kv, {
        userId: 'user-2',
        accessToken: 'access-old',
        refreshToken: 'refresh-old',
        expiresAt: Date.now() + 60 * 1000, // 1 minute — inside the 5min skew
      });

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: 'access-new',
            refresh_token: 'refresh-new',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
          { status: 200 }
        )
      );

      const ctx = buildEvent({ pathname: '/', cookies, kv });
      await runHandle(ctx.event);

      // locals reflect the refreshed access token.
      expect(ctx.event.locals.session).toEqual({
        userId: 'user-2',
        accessToken: 'access-new',
      });

      // Refresh lock was acquired.
      expect(ctx.kv.store.has('refresh_lock:user-2')).toBe(true);

      // Tokens were written to KV.
      const storedRaw = ctx.kv.store.get('token:user-2');
      expect(storedRaw).toBeDefined();
      const stored = JSON.parse(storedRaw!);
      expect(stored.accessToken).toBe('access-new');
      expect(stored.refreshToken).toBe('refresh-new');
    });

    it('falls back to the existing session when the refresh request fails', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      await seedSession(cookies, kv, {
        userId: 'user-3',
        accessToken: 'access-stale',
        refreshToken: 'refresh-stale',
        expiresAt: Date.now() + 60 * 1000,
      });

      globalThis.fetch = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }));

      const ctx = buildEvent({ pathname: '/', cookies, kv });
      await runHandle(ctx.event);

      expect(ctx.event.locals.session).toEqual({
        userId: 'user-3',
        accessToken: 'access-stale',
      });
    });

    it('skips the refresh entirely when another request holds the lock', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      await seedSession(cookies, kv, {
        userId: 'user-4',
        accessToken: 'access-current',
        refreshToken: 'refresh-current',
        expiresAt: Date.now() + 60 * 1000,
      });
      kv.store.set('refresh_lock:user-4', '1'); // Lock already held.

      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const ctx = buildEvent({ pathname: '/', cookies, kv });
      await runHandle(ctx.event);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(ctx.event.locals.session?.accessToken).toBe('access-current');
    });
  });

  describe('rate limiting', () => {
    it('returns 429 on the login route after the limit is exceeded', async () => {
      const kv = createFakeKv();
      // Pre-fill the bucket past the limit so the next call is blocked.
      const windowMs = 60 * 1000;
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      kv.store.set(`ratelimit:auth-login:203.0.113.99:${windowStart}`, '999');

      const ctx = buildEvent({
        pathname: '/api/auth/login',
        kv,
        clientIp: '203.0.113.99',
      });
      const res = await runHandle(ctx.event);

      expect(res.status).toBe(429);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(fakeResolve).not.toHaveBeenCalled();
    });

    it('does not rate-limit non-API routes', async () => {
      const ctx = buildEvent({ pathname: '/' });
      await runHandle(ctx.event);
      expect(fakeResolve).toHaveBeenCalledOnce();
      // Only the rate-limit bucket scan is on /api/* — for the landing page
      // there should be no KV writes at all.
      expect(ctx.kv.store.size).toBe(0);
    });

    it('returns 429 on /api/* once the user-keyed bucket is full', async () => {
      const cookies = createFakeCookies();
      const kv = createFakeKv();
      await seedSession(cookies, kv, {
        userId: 'user-rl',
        accessToken: 'tok',
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      const windowMs = 60 * 1000;
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      kv.store.set(`ratelimit:api:user-rl:${windowStart}`, '999');

      const ctx = buildEvent({ pathname: '/api/portfolios', cookies, kv });
      const res = await runHandle(ctx.event);

      expect(res.status).toBe(429);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
    });
  });
});
