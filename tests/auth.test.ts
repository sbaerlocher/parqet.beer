import { describe, it, expect, vi } from 'vitest';
import {
  createSessionCookie,
  getUserIdFromCookie,
  resolveSessionSecret,
  resolveOrigin,
  clearUserKv,
  storeTokens,
  getTokens,
} from '../src/lib/server/auth';

const SECRET = 'test-secret-at-least-32-characters-long!';

describe('session cookie (JWE)', () => {
  it('round-trips a userId through encrypt/decrypt', async () => {
    const cookie = await createSessionCookie('user_abc123', SECRET);
    expect(cookie).toBeTypeOf('string');
    expect(cookie.split('.').length).toBe(5); // JWE compact serialization

    const userId = await getUserIdFromCookie(cookie, SECRET);
    expect(userId).toBe('user_abc123');
  });

  it('rejects cookies signed with a different secret', async () => {
    const cookie = await createSessionCookie('user_abc123', SECRET);
    const userId = await getUserIdFromCookie(cookie, 'different-secret-also-32+chars!!');
    expect(userId).toBeNull();
  });

  it('returns null for malformed cookies', async () => {
    const userId = await getUserIdFromCookie('not-a-jwe', SECRET);
    expect(userId).toBeNull();
  });

  it('rejects sessions with an invalid schema', async () => {
    // Sneak in a JWE that decrypts but has a wrong-shape payload.
    // createSessionCookie always writes a valid userId, so we test with empty.
    const cookie = await createSessionCookie('', SECRET);
    const userId = await getUserIdFromCookie(cookie, SECRET);
    expect(userId).toBeNull();
  });

  it('throws when SESSION_SECRET is shorter than 32 bytes', async () => {
    await expect(createSessionCookie('user_abc123', 'too-short')).rejects.toThrow(
      /at least 32 bytes/
    );
  });
});

describe('resolveSessionSecret', () => {
  it('returns a plain string secret directly', async () => {
    const env = { SESSION_SECRET: 'my-plain-secret' } as unknown as App.Platform['env'];
    const result = await resolveSessionSecret(env);
    expect(result).toBe('my-plain-secret');
  });

  it('calls .get() on a Secrets Store binding', async () => {
    const env = {
      SESSION_SECRET: { get: vi.fn().mockResolvedValue('store-secret') },
    } as unknown as App.Platform['env'];
    const result = await resolveSessionSecret(env);
    expect(result).toBe('store-secret');
  });

  it('falls back to SESSION_SECRET_DEV when .get() throws', async () => {
    const env = {
      SESSION_SECRET: { get: vi.fn().mockRejectedValue(new Error('empty store')) },
      SESSION_SECRET_DEV: 'dev-fallback-secret',
    } as unknown as App.Platform['env'];
    const result = await resolveSessionSecret(env);
    expect(result).toBe('dev-fallback-secret');
  });

  it('re-throws when .get() fails and no dev override exists', async () => {
    const env = {
      SESSION_SECRET: { get: vi.fn().mockRejectedValue(new Error('no secret')) },
    } as unknown as App.Platform['env'];
    await expect(resolveSessionSecret(env)).rejects.toThrow('no secret');
  });

  it('re-throws when dev override is empty string', async () => {
    const env = {
      SESSION_SECRET: { get: vi.fn().mockRejectedValue(new Error('no secret')) },
      SESSION_SECRET_DEV: '',
    } as unknown as App.Platform['env'];
    await expect(resolveSessionSecret(env)).rejects.toThrow('no secret');
  });
});

describe('resolveOrigin', () => {
  it('returns plain HTTP origin for localhost', () => {
    const url = new URL('http://localhost:5173/api/auth/login');
    expect(resolveOrigin(url)).toBe('http://localhost:5173');
  });

  it('returns HTTPS when X-Forwarded-Proto is https', () => {
    const url = new URL('http://parqet-beer.test:5173/api/auth/login');
    const request = new Request(url, {
      headers: { 'x-forwarded-proto': 'https' },
    });
    expect(resolveOrigin(url, request)).toBe('https://parqet-beer.test:5173');
  });

  it('falls back to url.protocol when no request is provided', () => {
    const url = new URL('https://parqet.beer/api/auth/login');
    expect(resolveOrigin(url)).toBe('https://parqet.beer');
  });

  it('falls back to url.protocol when header is missing', () => {
    const url = new URL('http://localhost:5173/api/auth/login');
    const request = new Request(url);
    expect(resolveOrigin(url, request)).toBe('http://localhost:5173');
  });
});

describe('KV token storage', () => {
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
        list: vi.fn(async () => ({ keys: [] })),
      } as unknown as KVNamespace,
    };
  }

  it('stores and retrieves tokens', async () => {
    const { kv } = createFakeKv();
    const tokens = {
      accessToken: 'access-xyz',
      refreshToken: 'refresh-xyz',
      expiresAt: Date.now() + 3600_000,
    };

    await storeTokens(kv, 'user1', tokens);
    const result = await getTokens(kv, 'user1');
    expect(result).toEqual(tokens);
  });

  it('returns null for missing tokens', async () => {
    const { kv } = createFakeKv();
    const result = await getTokens(kv, 'nonexistent');
    expect(result).toBeNull();
  });

  it('stores tokens without refreshToken', async () => {
    const { kv } = createFakeKv();
    const tokens = {
      accessToken: 'access-xyz',
      expiresAt: Date.now() + 3600_000,
    };

    await storeTokens(kv, 'user1', tokens);
    const result = await getTokens(kv, 'user1');
    expect(result).toEqual(tokens);
  });
});

describe('clearUserKv', () => {
  it('deletes fixed keys including token and dynamic performance keys', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const kv = {
      list: vi.fn().mockResolvedValue({
        keys: [{ name: 'performance:u1:abc' }, { name: 'performance:u1:def' }],
      }),
      delete: deleteFn,
    } as unknown as KVNamespace;

    await clearUserKv(kv, 'u1');

    expect(kv.list).toHaveBeenCalledWith({ prefix: 'performance:u1:' });
    // 4 fixed (token, user, portfolios, preferences) + 2 dynamic = 6 deletes
    expect(deleteFn).toHaveBeenCalledTimes(6);
    expect(deleteFn).toHaveBeenCalledWith('token:u1');
    expect(deleteFn).toHaveBeenCalledWith('user:u1');
    expect(deleteFn).toHaveBeenCalledWith('portfolios:u1');
    expect(deleteFn).toHaveBeenCalledWith('preferences:u1');
    expect(deleteFn).toHaveBeenCalledWith('performance:u1:abc');
    expect(deleteFn).toHaveBeenCalledWith('performance:u1:def');
  });

  it('handles users with no performance cache entries', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const kv = {
      list: vi.fn().mockResolvedValue({ keys: [] }),
      delete: deleteFn,
    } as unknown as KVNamespace;

    await clearUserKv(kv, 'u2');
    expect(deleteFn).toHaveBeenCalledTimes(4); // only fixed keys (incl. token)
  });

  it('does not throw when individual deletes fail', async () => {
    const deleteFn = vi.fn().mockRejectedValueOnce(new Error('gone')).mockResolvedValue(undefined);
    const kv = {
      list: vi.fn().mockResolvedValue({ keys: [] }),
      delete: deleteFn,
    } as unknown as KVNamespace;

    // Promise.allSettled swallows individual failures.
    await expect(clearUserKv(kv, 'u3')).resolves.toBeUndefined();
  });
});
