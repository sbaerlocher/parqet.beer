// SPDX-License-Identifier: MIT
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '$lib/server/pkce';
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, resolveOrigin } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
  const env = platform!.env;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store PKCE verifier and state in short-lived cookies
  cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const redirectUri = `${resolveOrigin(url)}/api/auth/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.PARQET_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'portfolio:read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  redirect(302, `${env.PARQET_AUTHORIZE_URL}?${params}`);
};
