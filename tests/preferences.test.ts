import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, GET } from '../src/routes/api/preferences/+server';

/**
 * In-memory KV fake matching the subset of KVNamespace these handlers use.
 */
function createFakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    kv: {
      get: vi.fn(async (key: string, type?: string) => {
        const raw = store.get(key);
        if (raw === undefined) return null;
        return type === 'json' ? JSON.parse(raw) : raw;
      }),
      put: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      list: vi.fn(async () => ({ keys: [], list_complete: true })),
      getWithMetadata: vi.fn(),
    } as unknown as KVNamespace,
  };
}

interface BuildEventOpts {
  body?: unknown;
  bodyText?: string;
  origin?: string | null;
  session?: { userId: string; accessToken: string } | null;
  url?: string;
  kv?: KVNamespace;
}

function buildPutEvent(opts: BuildEventOpts = {}) {
  const url = new URL(opts.url ?? 'https://app.example.com/api/preferences');
  const headers = new Headers({ 'content-type': 'application/json' });
  if (opts.origin !== null) {
    headers.set('origin', opts.origin ?? 'https://app.example.com');
  }
  const bodyText = opts.bodyText !== undefined ? opts.bodyText : JSON.stringify(opts.body ?? {});
  const request = new Request(url, { method: 'PUT', headers, body: bodyText });
  const session =
    opts.session === undefined ? { userId: 'user-1', accessToken: 'tok' } : opts.session;
  const platform = { env: { PARQET_KV: opts.kv ?? createFakeKv().kv } };
  // The handler only touches a small subset of RequestEvent — cast loosely so
  // we don't have to fabricate the full surface.
  return {
    request,
    url,
    locals: { session },
    platform,
    cookies: {} as never,
    fetch: globalThis.fetch,
    getClientAddress: () => '127.0.0.1',
    params: {},
    route: { id: '/api/preferences' },
    setHeaders: () => {},
    isDataRequest: false,
    isSubRequest: false,
  } as unknown as Parameters<typeof PUT>[0];
}

async function expectStatus(
  promise: Response | Promise<Response>,
  status: number
): Promise<Response> {
  try {
    const res = await promise;
    expect(res.status).toBe(status);
    return res;
  } catch (e) {
    // SvelteKit's `error()` throws an HttpError-shaped object.
    if (typeof e === 'object' && e !== null && 'status' in e) {
      expect((e as { status: number }).status).toBe(status);
      return new Response(null, { status });
    }
    throw e;
  }
}

describe('PUT /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated callers with 401', async () => {
    await expectStatus(PUT(buildPutEvent({ session: null })), 401);
  });

  it('rejects requests without an Origin header with 403', async () => {
    await expectStatus(
      PUT(buildPutEvent({ origin: null, body: { currency: 'EUR', category: 'beer' } })),
      403
    );
  });

  it('rejects cross-origin requests with 403', async () => {
    await expectStatus(
      PUT(
        buildPutEvent({
          origin: 'https://attacker.example',
          body: { currency: 'EUR', category: 'beer' },
        })
      ),
      403
    );
  });

  it('rejects malformed JSON with 400', async () => {
    await expectStatus(PUT(buildPutEvent({ bodyText: '{not json' })), 400);
  });

  it('rejects an unknown currency with 400', async () => {
    await expectStatus(PUT(buildPutEvent({ body: { currency: 'USD', category: 'beer' } })), 400);
  });

  it('rejects an unknown category with 400', async () => {
    await expectStatus(PUT(buildPutEvent({ body: { currency: 'EUR', category: 'wine' } })), 400);
  });

  it('persists valid preferences and echoes them back', async () => {
    const fake = createFakeKv();
    const event = buildPutEvent({
      kv: fake.kv,
      body: { currency: 'CHF', category: 'coffee' },
    });
    const res = await PUT(event);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ currency: 'CHF', category: 'coffee' });
    expect(fake.store.get('preferences:user-1')).toBe(
      JSON.stringify({ currency: 'CHF', category: 'coffee' })
    );
  });
});

describe('GET /api/preferences', () => {
  function buildGetEvent(opts: { kv?: KVNamespace; session?: BuildEventOpts['session'] } = {}) {
    const url = new URL('https://app.example.com/api/preferences');
    const session =
      opts.session === undefined ? { userId: 'user-1', accessToken: 'tok' } : opts.session;
    return {
      request: new Request(url),
      url,
      locals: { session },
      platform: { env: { PARQET_KV: opts.kv ?? createFakeKv().kv } },
      cookies: {} as never,
      fetch: globalThis.fetch,
      getClientAddress: () => '127.0.0.1',
      params: {},
      route: { id: '/api/preferences' },
      setHeaders: () => {},
      isDataRequest: false,
      isSubRequest: false,
    } as unknown as Parameters<typeof GET>[0];
  }

  it('returns defaults when nothing is stored', async () => {
    const res = await GET(buildGetEvent());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ currency: 'EUR', category: 'beer' });
  });

  it('returns the stored preferences when present', async () => {
    const fake = createFakeKv();
    fake.store.set('preferences:user-1', JSON.stringify({ currency: 'CHF', category: 'smoothie' }));
    const res = await GET(buildGetEvent({ kv: fake.kv }));
    expect(await res.json()).toEqual({ currency: 'CHF', category: 'smoothie' });
  });

  it('rejects unauthenticated callers with 401', async () => {
    await expectStatus(GET(buildGetEvent({ session: null })), 401);
  });
});
