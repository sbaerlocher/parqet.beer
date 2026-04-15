/**
 * Simple fixed-window rate limiter backed by Cloudflare KV.
 *
 * Trade-offs:
 * - Fixed-window (not sliding) — cheap, one read + one write per request.
 * - Eventually consistent — KV writes propagate across regions within seconds,
 *   so bursty attackers can exceed the limit at the edges. Good enough for
 *   abuse mitigation on a hobby project; not a replacement for Cloudflare
 *   Rate Limiting Rules if you need strict guarantees.
 * - Keys auto-expire via `expirationTtl` so there is no cleanup.
 */

export interface RateLimitOptions {
  /** Max number of requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /** Identifier for the caller — typically `userId` or IP. */
  identifier: string;
  /** Optional bucket name so different routes don't share counters. */
  bucket?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  /** How many requests are left in the current window. */
  remaining: number;
  /** Unix seconds at which the current window ends. */
  resetAt: number;
}

export async function rateLimit(kv: KVNamespace, opts: RateLimitOptions): Promise<RateLimitResult> {
  const bucket = opts.bucket ?? 'default';
  const windowMs = opts.windowSeconds * 1000;
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = Math.floor((windowStart + windowMs) / 1000);
  const key = `ratelimit:${bucket}:${opts.identifier}:${windowStart}`;

  const currentRaw = await kv.get(key);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;

  if (current >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  await kv.put(key, String(current + 1), {
    expirationTtl: opts.windowSeconds * 2,
  });

  return {
    allowed: true,
    remaining: Math.max(0, opts.limit - current - 1),
    resetAt,
  };
}
