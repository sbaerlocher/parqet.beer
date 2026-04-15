import { expect, test } from '@playwright/test';

test('GET /api/health returns 200 with status + timestamp', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);

  const body = (await response.json()) as { status: string; timestamp: string };
  expect(body.status).toBe('ok');
  // ISO-8601 timestamps parse cleanly; anything else (undefined, null, bad
  // format) → NaN and this assertion catches a drift in the contract.
  expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
});
