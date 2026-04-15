import { describe, it, expect } from 'vitest';
import { GET } from '../src/routes/api/health/+server';

// Deterministic probe — no auth, no KV, no upstream calls. The handler takes
// a SvelteKit `RequestEvent` but only uses it structurally; `{} as never`
// keeps TS happy without dragging in the full event factory.
describe('/api/health', () => {
  it('returns 200 with { status: "ok", timestamp }', async () => {
    const response = await GET({} as never);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; timestamp: string };
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
