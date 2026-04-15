import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../src/lib/server/pkce';

describe('PKCE utilities', () => {
  it('generates a URL-safe code verifier of sufficient length', () => {
    const verifier = generateCodeVerifier();
    // RFC 7636: verifier must be 43–128 characters, base64url-encoded.
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates a different verifier on every call', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });

  it('derives a deterministic code challenge from a verifier', async () => {
    const verifier = 'fixed-test-verifier-for-hashing';
    const a = await generateCodeChallenge(verifier);
    const b = await generateCodeChallenge(verifier);
    expect(a).toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('produces distinct challenges for distinct verifiers', async () => {
    const a = await generateCodeChallenge('verifier-one');
    const b = await generateCodeChallenge('verifier-two');
    expect(a).not.toBe(b);
  });

  it('generates a URL-safe random state', () => {
    const state = generateState();
    expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(state.length).toBeGreaterThan(10);
    expect(generateState()).not.toBe(state);
  });
});
