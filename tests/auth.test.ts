import { describe, it, expect } from 'vitest';
import {
  createSessionCookie,
  getSessionFromCookie,
  type AuthSession,
} from '../src/lib/server/auth';

const SECRET = 'test-secret-at-least-32-characters-long!';

const sampleSession: AuthSession = {
  userId: 'user_abc123',
  accessToken: 'access-token-xyz',
  refreshToken: 'refresh-token-xyz',
  expiresAt: Date.now() + 60_000,
};

describe('session cookie (JWE)', () => {
  it('round-trips a session through encrypt/decrypt', async () => {
    const cookie = await createSessionCookie(sampleSession, SECRET);
    expect(cookie).toBeTypeOf('string');
    expect(cookie.split('.').length).toBe(5); // JWE compact serialization

    const decoded = await getSessionFromCookie(cookie, SECRET);
    expect(decoded).toEqual(sampleSession);
  });

  it('rejects cookies signed with a different secret', async () => {
    const cookie = await createSessionCookie(sampleSession, SECRET);
    const decoded = await getSessionFromCookie(cookie, 'different-secret-also-32+chars!!');
    expect(decoded).toBeNull();
  });

  it('returns null for malformed cookies', async () => {
    const decoded = await getSessionFromCookie('not-a-jwe', SECRET);
    expect(decoded).toBeNull();
  });

  it('rejects sessions with an invalid schema', async () => {
    // Sneak in a JWE that decrypts but has a wrong-shape payload.
    const badCookie = await createSessionCookie(
      // @ts-expect-error — intentionally wrong shape for the test
      { userId: '', accessToken: 123 },
      SECRET
    );
    const decoded = await getSessionFromCookie(badCookie, SECRET);
    expect(decoded).toBeNull();
  });

  it('throws when SESSION_SECRET is shorter than 32 bytes', async () => {
    await expect(createSessionCookie(sampleSession, 'too-short')).rejects.toThrow(
      /at least 32 bytes/
    );
  });
});
