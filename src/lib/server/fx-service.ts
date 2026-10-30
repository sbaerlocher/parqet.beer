// SPDX-License-Identifier: MIT
import { z } from 'zod';
import { FX_FALLBACK, isUsableRates, SUPPORTED_CURRENCIES, type FxRates } from '../fx';

export type { FxRates } from '../fx';

/** KV key holding the most recently fetched rate set. */
export const FX_CACHE_KEY = 'fx:rates';

/** How old a cached entry may be before we try upstream again. */
export const FX_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** After a failed refresh, serve the cached entry this long before retrying. */
export const FX_RETRY_MS = 5 * 60 * 1000;

/** Upstream timeout — a stalled Frankfurter must not stall `/api/performance`. */
const FX_TIMEOUT_MS = 3000;

const NON_EUR = SUPPORTED_CURRENCIES.filter((c) => c !== 'EUR');

/** Overridable via `FX_API_URL` so e2e points at the in-app mock. */
export const FX_API_URL = 'https://api.frankfurter.dev/v1';

// Frankfurter is a foreign API and therefore a trust boundary: parse, don't
// assume. Rates arrive keyed by currency code with EUR omitted (it's the base).
const FrankfurterResponseSchema = z.object({
  base: z.literal('EUR'),
  rates: z.record(z.string(), z.number()),
});

interface CachedRates {
  rates: FxRates;
  fetchedAt: number;
  /** Last failed refresh; suppresses retries for `FX_RETRY_MS`. */
  failedAt?: number;
}

/**
 * Fetch today's ECB reference rates. Returns null on *any* failure — network
 * error, non-2xx, unparseable body, or values that would poison the
 * conversions — so the caller can fall back rather than propagate a bad rate.
 */
export async function fetchRates(apiUrl: string = FX_API_URL): Promise<FxRates | null> {
  try {
    const response = await fetch(`${apiUrl}/latest?from=EUR&to=${NON_EUR.join(',')}`, {
      signal: AbortSignal.timeout(FX_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn('[fx-service] Frankfurter responded', response.status);
      return null;
    }

    const parsed = FrankfurterResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.warn('[fx-service] Unexpected Frankfurter payload shape');
      return null;
    }

    // EUR is the base and is absent from `rates` — add it so downstream code
    // can treat every supported currency uniformly.
    const rates = { EUR: 1, ...parsed.data.rates };
    if (!isUsableRates(rates)) {
      console.warn('[fx-service] Frankfurter payload missing or invalid rates');
      return null;
    }

    return rates;
  } catch (e) {
    console.warn('[fx-service] Frankfurter fetch failed:', e);
    return null;
  }
}

/**
 * Current EUR-based rates, with a cascade that never throws:
 *
 *   1. KV entry younger than `FX_MAX_AGE_MS` → use it
 *   2. otherwise fetch upstream; on success overwrite KV
 *   3. fetch failed but KV holds an older entry → serve it stale
 *   4. nothing anywhere → `FX_FALLBACK`
 *
 * The KV entry deliberately carries no `expirationTtl`. A TTL would delete the
 * stale entry during a *prolonged* upstream outage — precisely when step 3 is
 * the only thing standing between the user and hardcoded fallback numbers. The
 * 24h window is a freshness check on read, not a lifetime.
 *
 * That is also why this doesn't go through `getCached`: that helper cannot
 * serve a stale entry when the fetcher fails.
 */
export async function getRates(env: Cloudflare.Env): Promise<FxRates> {
  let cached: CachedRates | null = null;
  try {
    const stored = await env.PARQET_KV.get<CachedRates>(FX_CACHE_KEY, 'json');
    if (stored && isUsableRates(stored.rates) && typeof stored.fetchedAt === 'number') {
      cached = stored;
    }
  } catch (e) {
    console.warn('[fx-service] KV read failed:', e);
  }

  const now = Date.now();
  if (
    cached &&
    (now - cached.fetchedAt < FX_MAX_AGE_MS ||
      (cached.failedAt !== undefined && now - cached.failedAt < FX_RETRY_MS))
  ) {
    return cached.rates;
  }

  const fresh = await fetchRates(env.FX_API_URL || FX_API_URL);
  if (fresh) {
    try {
      await env.PARQET_KV.put(
        FX_CACHE_KEY,
        JSON.stringify({ rates: fresh, fetchedAt: Date.now() } satisfies CachedRates)
      );
    } catch (e) {
      console.warn('[fx-service] KV write failed:', e);
    }
    return fresh;
  }

  // Remember the failure so the next requests during an outage skip the
  // upstream round-trip. Without a cached entry the fallback is stored, which
  // `isUsableRates` accepts and which equals what we would return anyway.
  const rates = cached?.rates ?? FX_FALLBACK;
  try {
    await env.PARQET_KV.put(
      FX_CACHE_KEY,
      JSON.stringify({
        rates,
        fetchedAt: cached?.fetchedAt ?? 0,
        failedAt: now,
      } satisfies CachedRates)
    );
  } catch (e) {
    console.warn('[fx-service] KV write failed:', e);
  }

  console.warn(
    cached
      ? '[fx-service] Upstream unavailable, serving stale rates'
      : '[fx-service] No live or cached rates available, using fallback'
  );
  return rates;
}
