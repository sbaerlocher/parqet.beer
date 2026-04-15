import * as jose from 'jose';
import { z } from 'zod';
import type { Cookies } from '@sveltejs/kit';

// `__Host-` prefix enforces Secure, no Domain, Path=/ — blocks sub-domain overwrites.
export const SESSION_COOKIE = '__Host-auth_session';
export const OAUTH_STATE_COOKIE = '__Host-oauth_state';
export const OAUTH_VERIFIER_COOKIE = '__Host-oauth_code_verifier';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const AuthSessionSchema = z.object({
  userId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.number().int().nonnegative(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

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

export async function createSessionCookie(session: AuthSession, secret: string): Promise<string> {
  const secretKey = await deriveKey(secret);
  return new jose.EncryptJWT({ session })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .encrypt(secretKey);
}

export async function getSessionFromCookie(
  cookie: string,
  secret: string
): Promise<AuthSession | null> {
  try {
    const secretKey = await deriveKey(secret);
    const { payload } = await jose.jwtDecrypt(cookie, secretKey);
    const parsed = AuthSessionSchema.safeParse(payload['session']);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getSession(cookies: Cookies, secret: string): Promise<AuthSession | null> {
  const cookie = cookies.get(SESSION_COOKIE);
  if (!cookie) return null;
  return getSessionFromCookie(cookie, secret);
}

export async function setSessionCookie(
  cookies: Cookies,
  session: AuthSession,
  secret: string
): Promise<void> {
  const encrypted = await createSessionCookie(session, secret);
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

/**
 * Remove all KV entries owned by a user session. Called on logout so cached
 * Parqet data doesn't linger after the user explicitly ends their session.
 * Tokens are not stored in KV — they live only in the encrypted session
 * cookie, which is cleared separately.
 */
export async function clearUserKv(kv: KVNamespace, userId: string): Promise<void> {
  const fixedKeys = [`user:${userId}`, `portfolios:${userId}`, `preferences:${userId}`];

  // Performance cache uses dynamic keys like `performance:{userId}:{ids}`.
  const performanceList = await kv.list({ prefix: `performance:${userId}:` });
  const dynamicKeys = performanceList.keys.map((k) => k.name);

  await Promise.allSettled([...fixedKeys, ...dynamicKeys].map((key) => kv.delete(key)));
}
