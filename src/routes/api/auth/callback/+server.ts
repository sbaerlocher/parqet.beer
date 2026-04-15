import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getUserInfo } from '$lib/server/parqet-client';
import {
  setSessionCookie,
  resolveSessionSecret,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const env = platform!.env;

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get(OAUTH_STATE_COOKIE);
  const codeVerifier = cookies.get(OAUTH_VERIFIER_COOKIE);

  // Clean up OAuth cookies
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });
  cookies.delete(OAUTH_VERIFIER_COOKIE, { path: '/' });

  if (!code || !state || !storedState || !codeVerifier) {
    error(400, 'Missing OAuth parameters');
  }

  if (state !== storedState) {
    error(400, 'Invalid state parameter');
  }

  const redirectUri = `${url.origin}/api/auth/callback`;

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, redirectUri, env, codeVerifier);
  if (!tokens) {
    error(500, 'Token exchange failed');
  }

  // Get user info
  const userInfo = await getUserInfo(env.PARQET_API_URL, tokens.access_token);
  if (!userInfo) {
    error(500, 'Failed to fetch user info');
  }

  // Store user info in KV (1h TTL). Tokens live only in the encrypted
  // session cookie — there is no second copy in KV.
  await env.PARQET_KV.put(`user:${userInfo.userId}`, JSON.stringify(userInfo), {
    expirationTtl: 3600,
  });

  // Create session cookie
  const sessionSecret = await resolveSessionSecret(env);
  await setSessionCookie(
    cookies,
    {
      userId: userInfo.userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    },
    sessionSecret
  );

  redirect(302, '/dashboard');
};
