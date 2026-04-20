// SPDX-License-Identifier: MIT
interface CachedValue<T> {
  data: T;
  fetchedAt: number;
}

export async function getCached<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await kv.get<CachedValue<T>>(key, 'json');

  if (cached && Date.now() - cached.fetchedAt < ttlSeconds * 1000) {
    return cached.data;
  }

  const data = await fetcher();

  // Don't persist empty responses — a transient upstream failure would
  // otherwise poison the cache for the whole TTL window.
  if (data !== null && data !== undefined) {
    await kv.put(key, JSON.stringify({ data, fetchedAt: Date.now() } satisfies CachedValue<T>), {
      expirationTtl: ttlSeconds * 2,
    });
  }

  return data;
}
