import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const PreferencesSchema = z.object({
  currency: z.enum(['EUR', 'CHF']),
  category: z.enum(['beer', 'coffee', 'smoothie']),
});

export type UserPreferences = z.infer<typeof PreferencesSchema>;

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'EUR',
  category: 'beer',
};

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.session) error(401, 'Unauthorized');

  const env = platform!.env;
  const stored = await env.PARQET_KV.get<UserPreferences>(
    `preferences:${locals.session.userId}`,
    'json'
  );

  return json(stored ?? DEFAULT_PREFERENCES);
};

export const PUT: RequestHandler = async ({ locals, platform, request, url }) => {
  if (!locals.session) error(401, 'Unauthorized');

  // SvelteKit's built-in CSRF protection only covers form-encoded POSTs.
  // JSON bodies bypass that check, so explicitly require the Origin header
  // to match our own host.
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) {
    error(403, 'Forbidden');
  }

  const env = platform!.env;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    error(400, 'Invalid JSON body');
  }

  const parsed = PreferencesSchema.safeParse(raw);
  if (!parsed.success) {
    error(400, `Invalid preferences: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
  }

  await env.PARQET_KV.put(`preferences:${locals.session.userId}`, JSON.stringify(parsed.data));

  return json(parsed.data);
};
