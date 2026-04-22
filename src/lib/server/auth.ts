// SPDX-License-Identifier: MIT
import * as jose from 'jose';
import { z } from 'zod';
import type { Cookies } from '@sveltejs/kit';

/** Resolve the public-facing origin. Behind a TLS-terminating reverse proxy
 *  (e.g. Traefik) the internal connection is plain HTTP, but the client-facing
 *  side is HTTPS — reflected in the X-Forwarded-Proto header. */
export function resolveOrigin(url: URL, request?: Request): string {
  const proto = request?.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${url.host}`;
}

// `__Host-` prefix enforces Secure, no Domain, Path=/ — blocks sub-domain overwrites.
export const SESSION_COOKIE = '__Host-auth_session';
export const OAUTH_STATE_COOKIE = '__Host-oauth_state';
export const OAUTH_VERIFIER_COOKIE = '__Host-oauth_code_verifier';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (matches KV token TTL)

// KV TTL for token entries — 30 days, same as parqet.parser.
const TOKEN_KV_TTL = 2_592_000; // 30 days in seconds

// Cookie only holds the userId — tokens live in KV.
const SessionCookieSchema = z.object({
  userId: z.string().min(1),
});

// Token data stored in KV under `token:{userId}`.
const TokenDataSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.number().int().nonnegative(),
});

export type TokenData = z.infer<typeof TokenDataSchema>;

// What route handlers see via `event.locals.session`.
export interface AuthSession {
  userId: string;
  accessToken: string;
}

// Full session state used internally by the hooks refresh logic.
export interface FullSession {
  userId: string;
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt: number;
}

// Minimum entropy for the JWE A256GCM key. We hash the secret via SHA-256 to
// fit the 32-byte key size, but that hash only spreads existing entropy — it
// doesn't create any. 32 bytes = 256 bits matches the A256GCM key size, so
// the derived key carries the full entropy of the cipher. Reject shorter
// secrets loudly so misconfigured deploys fail fast instead of running with a
// weak session key.
const MIN_SESSION_SECRET_BYTES = 32;

/**
 * Resolve the session secret regardless of whether it arrives as a plain
 * string (local dev via `.dev.vars`) or as a Cloudflare Secrets Store binding
 * (production, where `env.SESSION_SECRET.get()` fetches the underlying value).
 * Consumers should always route through this helper so new storage backends
 * can be added in one place.
 *
 * Local dev quirk: Wrangler's `vite dev` always wraps `env.SESSION_SECRET`
 * as a `SecretsStoreSecret` proxy because of the `secrets_store_secrets`
 * binding in `wrangler.jsonc`, but the emulator store is empty so `.get()`
 * throws. As a fallback we read `env.SESSION_SECRET_DEV` from `.dev.vars`,
 * which only exists locally.
 */
export async function resolveSessionSecret(env: App.Platform['env']): Promise<string> {
  const secret = env.SESSION_SECRET;
  if (typeof secret === 'string') return secret;

  try {
    return await secret.get();
  } catch (err) {
    const devOverride = env.SESSION_SECRET_DEV;
    if (typeof devOverride === 'string' && devOverride.length > 0) {
      return devOverride;
    }
    throw err;
  }
}

async function deriveKey(secret: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(secret);
  if (encoded.length < MIN_SESSION_SECRET_BYTES) {
    throw new Error(
      `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_BYTES} bytes (got ${encoded.length})`
    );
  }
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(hash);
}

export async function createSessionCookie(userId: string, secret: string): Promise<string> {
  const secretKey = await deriveKey(secret);
  return new jose.EncryptJWT({ session: { userId } })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(secretKey);
}

export async function getUserIdFromCookie(cookie: string, secret: string): Promise<string | null> {
  try {
    const secretKey = await deriveKey(secret);
    const { payload } = await jose.jwtDecrypt(cookie, secretKey);
    const parsed = SessionCookieSchema.safeParse(payload['session']);
    return parsed.success ? parsed.data.userId : null;
  } catch {
    return null;
  }
}

export async function getUserId(cookies: Cookies, secret: string): Promise<string | null> {
  const cookie = cookies.get(SESSION_COOKIE);
  if (!cookie) return null;
  return getUserIdFromCookie(cookie, secret);
}

export async function setSessionCookie(
  cookies: Cookies,
  userId: string,
  secret: string
): Promise<void> {
  const encrypted = await createSessionCookie(userId, secret);
  cookies.set(SESSION_COOKIE, encrypted, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

// --- KV token storage ---

export async function storeTokens(
  kv: KVNamespace,
  userId: string,
  tokens: TokenData
): Promise<void> {
  await kv.put(`token:${userId}`, JSON.stringify(tokens), {
    expirationTtl: TOKEN_KV_TTL,
  });
}

export async function getTokens(kv: KVNamespace, userId: string): Promise<TokenData | null> {
  const raw = await kv.get(`token:${userId}`);
  if (!raw) return null;
  const parsed = TokenDataSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

/**
 * Remove all KV entries owned by a user session. Called on logout so cached
 * Parqet data and tokens don't linger after the user explicitly ends their
 * session.
 */
export async function clearUserKv(kv: KVNamespace, userId: string): Promise<void> {
  const fixedKeys = [
    `token:${userId}`,
    `user:${userId}`,
    `portfolios:${userId}`,
    `preferences:${userId}`,
  ];

  // Performance cache uses dynamic keys like `performance:{userId}:{ids}`.
  const performanceList = await kv.list({ prefix: `performance:${userId}:` });
  const dynamicKeys = performanceList.keys.map((k) => k.name);

  await Promise.allSettled([...fixedKeys, ...dynamicKeys].map((key) => kv.delete(key)));
}
