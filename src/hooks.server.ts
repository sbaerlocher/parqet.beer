import { json, type Handle } from '@sveltejs/kit';
import {
  getSession,
  setSessionCookie,
  resolveSessionSecret,
  type AuthSession,
} from '$lib/server/auth';
import { refreshAccessToken } from '$lib/server/parqet-client';
import { rateLimit } from '$lib/server/rate-limit';
import { applySecurityHeaders } from '$lib/server/security-headers';

// Locale-Handoff-Contract:
//   - `event.locals.locale` is populated on every request from the `locale`
//     cookie (httpOnly false so the client can toggle it), validated against
//     SUPPORTED_LOCALES, defaulting to 'de'.
//   - `transformPageChunk` swaps `%sveltekit.lang%` in `src/app.html` with the
//     resolved locale so SSR HTML ships the correct `<html lang>` attribute.
//   - Frontend agent: read `event.locals.locale` in `+layout.server.ts` to
//     seed the client-side i18n store. The cookie is the single source of
//     truth; update it via `document.cookie = 'locale=en; path=/; max-age=...'`
//     or a dedicated `/api/preferences` endpoint.
const SUPPORTED_LOCALES = ['de', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = 'de';

function resolveLocale(raw: string | undefined): SupportedLocale {
  if (raw && (SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    return raw as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

// Refresh access tokens that expire within this window on the next request.
const REFRESH_SKEW_MS = 5 * 60 * 1000; // 5 minutes

// Per-identifier API rate limit. 60 requests per minute gives the dashboard
// plenty of headroom (it makes ~3 requests on load) while stopping scrapers.
const API_RATE_LIMIT = 60;
const API_RATE_WINDOW_SECONDS = 60;

// Tighter bucket for the OAuth login initiator — each call writes a PKCE
// verifier to a cookie and burns a Parqet authorize request. 10/min/IP is
// generous for humans and cuts off spam.
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_SECONDS = 60;

async function maybeRefreshSession(
  session: AuthSession,
  env: App.Platform['env'],
  cookies: Parameters<typeof setSessionCookie>[0],
  sessionSecret: string
): Promise<AuthSession> {
  if (!session.refreshToken) return session;
  if (session.expiresAt - Date.now() > REFRESH_SKEW_MS) return session;

  // Best-effort lock to prevent parallel requests from double-spending the
  // same refresh token. KV is eventually consistent, so this is not a hard
  // mutex — but it drastically shrinks the race window in practice. If the
  // lock is present, fall through with the (still-valid-for-a-bit) current
  // session and let the next request pick up the refreshed one.
  // 60s is the minimum expirationTtl KV accepts.
  const lockKey = `refresh_lock:${session.userId}`;
  const existing = await env.PARQET_KV.get(lockKey);
  if (existing) return session;
  await env.PARQET_KV.put(lockKey, '1', { expirationTtl: 60 });

  const tokens = await refreshAccessToken(session.refreshToken, env);
  if (!tokens) return session; // Fall through: endpoint call will 401, user re-auths.

  const refreshed: AuthSession = {
    userId: session.userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };

  // Persist to the encrypted session cookie so subsequent requests use the
  // fresh token. Tokens are not mirrored to KV — the cookie is the only
  // authoritative store.
  await setSessionCookie(cookies, refreshed, sessionSecret);

  return refreshed;
}

function rateLimitResponse(result: { resetAt: number }, limit: number): Response {
  return json(
    { error: 'Rate limit exceeded', resetAt: result.resetAt },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.resetAt - Math.floor(Date.now() / 1000)),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  );
}

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env;

  // Locale resolution runs unconditionally so SSR always has a valid lang
  // attribute, even in the (test) codepath where `event.platform` is absent.
  event.locals.locale = resolveLocale(event.cookies.get('locale'));

  if (env) {
    // Resolve the Secrets Store binding once per request — `env.SESSION_SECRET`
    // is an async binding in production and a plain string in local dev.
    const sessionSecret = await resolveSessionSecret(env);

    const raw = await getSession(event.cookies, sessionSecret);
    const session = raw ? await maybeRefreshSession(raw, env, event.cookies, sessionSecret) : null;
    event.locals.session = session
      ? { userId: session.userId, accessToken: session.accessToken }
      : null;

    // adapter-cloudflare resolves this from cf-connecting-ip, so no manual
    // header fallback is needed.
    const clientIp = event.getClientAddress();

    // Dedicated low-limit bucket for the OAuth login initiator. Callback and
    // logout are exempt: callback is gated by the one-shot state cookie and
    // logout must always succeed even under load.
    if (event.url.pathname === '/api/auth/login') {
      const result = await rateLimit(env.PARQET_KV, {
        limit: LOGIN_RATE_LIMIT,
        windowSeconds: LOGIN_RATE_WINDOW_SECONDS,
        identifier: clientIp,
        bucket: 'auth-login',
      });
      if (!result.allowed) return rateLimitResponse(result, LOGIN_RATE_LIMIT);
    }

    // General API rate limit. Key by userId when logged in, by client IP
    // otherwise so anonymous callers can't blast the Parqet proxy.
    const isAuthRoute = event.url.pathname.startsWith('/api/auth/');
    if (event.url.pathname.startsWith('/api/') && !isAuthRoute) {
      const identifier = session?.userId ?? clientIp;

      const result = await rateLimit(env.PARQET_KV, {
        limit: API_RATE_LIMIT,
        windowSeconds: API_RATE_WINDOW_SECONDS,
        identifier,
        bucket: 'api',
      });

      if (!result.allowed) return rateLimitResponse(result, API_RATE_LIMIT);
    }
  } else {
    event.locals.session = null;
  }

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%sveltekit.lang%', event.locals.locale ?? DEFAULT_LOCALE),
  });

  // Apply security headers to every response (HTML, JSON, assets). CSP is
  // tightest on HTML but harmless on JSON; STS/XFO/etc. are universally safe.
  applySecurityHeaders(response.headers);

  return response;
};
