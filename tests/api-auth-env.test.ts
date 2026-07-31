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

interface LoginEventOpts {
  env?: Record<string, unknown> | undefined;
}

function buildLoginEvent(opts: LoginEventOpts = {}) {
  const url = new URL('https://app.example.com/api/auth/login');
  const request = new Request(url);
  // The handler only touches a small subset of RequestEvent — cast loosely so
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
    route: { id: '/api/auth/login' },
    setHeaders: () => {},
    isDataRequest: false,
    isSubRequest: false,
  } as unknown as Parameters<typeof login>[0];
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

function buildCallbackEvent(opts: LoginEventOpts = {}) {
  const url = new URL('https://app.example.com/api/auth/callback?code=c&state=s');
  const request = new Request(url);
  return {
    request,
    url,
    locals: { session: null },
    platform: opts.env === undefined ? undefined : { env: opts.env },
    cookies: { set: () => {}, get: () => undefined, delete: () => {} },
    fetch: globalThis.fetch,
    getClientAddress: () => '127.0.0.1',
    params: {},
    route: { id: '/api/auth/callback' },
    setHeaders: () => {},
    isDataRequest: false,
    isSubRequest: false,
  } as unknown as Parameters<typeof callback>[0];
}

describe('GET /api/auth/callback without bindings', () => {
  it('responds 503 when platform.env is empty', async () => {
    await expectStatus(callback(buildCallbackEvent({ env: {} })) as Promise<Response>, 503);
  });

  it('responds 503 when platform is missing entirely', async () => {
    await expectStatus(callback(buildCallbackEvent()) as Promise<Response>, 503);
  });
});
