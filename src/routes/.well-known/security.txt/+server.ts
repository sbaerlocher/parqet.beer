// SPDX-License-Identifier: MIT
import type { RequestHandler } from './$types';

// RFC 9116 disclosure pointer. `Expires` is computed per request (now + 6
// months) so the file never goes stale without a human editing it — RFC 9116
// §2.5.5 treats an expired document as invalid.
const CONTACT = 'security@parqet.beer';
const PREFERRED_LANGUAGES = ['de', 'en'] as const;
const EXPIRES_MONTHS = 6;

export const GET: RequestHandler = () => {
  const expires = new Date();
  expires.setUTCMonth(expires.getUTCMonth() + EXPIRES_MONTHS);

  const body =
    [
      `Contact: mailto:${CONTACT}`,
      `Expires: ${expires.toISOString()}`,
      `Preferred-Languages: ${PREFERRED_LANGUAGES.join(', ')}`,
    ].join('\n') + '\n';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
