import { describe, it, expect } from 'vitest';
import { GET as login } from '../src/routes/api/auth/login/+server';
import { GET as callback } from '../src/routes/api/auth/callback/+server';

/**
 * Both SvelteKit's `error()` and `redirect()` throw, so the status always
 * arrives via the catch path. Locally defined rather than shared, matching the
 * other route tests in this directory.
 */
async function expectStatus(promise: Promise<Response>, status: number): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'status' in e) {
      expect((e as { status: number }).status).toBe(status);
      return e;
    }
    throw e;
  }
  throw new Error(`expected a ${status} to be thrown`);
}

interface AuthEventOpts {
  env?: Record<string, unknown> | undefined;
}

function buildAuthEvent(routeId: string, path: string, opts: AuthEventOpts = {}) {
  const url = new URL(`https://app.example.com${path}`);
  const request = new Request(url);
  // The handlers only touch a small subset of RequestEvent — cast loosely so
  // we don't have to fabricate the full surface.
  return {
    request,
    url,
    locals: { session: null },
    platform: opts.env === undefined ? undefined : { env: opts.env },
    cookies: { set: () => {}, get: () => undefined, delete: () => {} },
    fetch: globalThis.fetch,
    getClientAddress: () => '127.0.0.1',
    params: {},
    route: { id: routeId },
    setHeaders: () => {},
    isDataRequest: false,
    isSubRequest: false,
  };
}

function buildLoginEvent(opts: AuthEventOpts = {}) {
  return buildAuthEvent('/api/auth/login', '/api/auth/login', opts) as unknown as Parameters<
    typeof login
  >[0];
}

describe('GET /api/auth/login without bindings', () => {
  it('responds 503 when platform.env is empty', async () => {
    await expectStatus(login(buildLoginEvent({ env: {} })) as Promise<Response>, 503);
  });

  it('responds 503 when platform is missing entirely', async () => {
    await expectStatus(login(buildLoginEvent()) as Promise<Response>, 503);
  });

  it('still redirects to the authorize URL when bindings are present', async () => {
    const thrown = (await expectStatus(
      login(
        buildLoginEvent({
          env: {
            PARQET_CLIENT_ID: 'client-1',
            PARQET_AUTHORIZE_URL: 'https://auth.example.com/authorize',
          },
        })
      ) as Promise<Response>,
      302
    )) as { location: string };

    expect(thrown.location).toContain('https://auth.example.com/authorize?');
    expect(thrown.location).toContain('client_id=client-1');
  });
});

function buildCallbackEvent(opts: AuthEventOpts = {}) {
  return buildAuthEvent(
    '/api/auth/callback',
    '/api/auth/callback?code=c&state=s',
    opts
  ) as unknown as Parameters<typeof callback>[0];
}

describe('GET /api/auth/callback without bindings', () => {
  it('responds 503 when platform.env is empty', async () => {
    await expectStatus(callback(buildCallbackEvent({ env: {} })) as Promise<Response>, 503);
  });

  it('responds 503 when platform is missing entirely', async () => {
    await expectStatus(callback(buildCallbackEvent()) as Promise<Response>, 503);
  });

  // The token exchange reads PARQET_CLIENT_ID indirectly, so a partial env is
  // the case that actually exercises the key list — a fully empty env would
  // pass even with the key missing from it.
  it('responds 503 when only PARQET_CLIENT_ID is absent', async () => {
    await expectStatus(
      callback(
        buildCallbackEvent({
          env: {
            PARQET_TOKEN_URL: 'https://auth.example.com/token',
            PARQET_API_URL: 'https://api.example.com',
            PARQET_KV: {} as KVNamespace,
            SESSION_SECRET: 'secret',
          },
        })
      ) as Promise<Response>,
      503
    );
  });
});
