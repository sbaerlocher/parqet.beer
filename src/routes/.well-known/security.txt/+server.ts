// SPDX-License-Identifier: MIT
import type { RequestHandler } from './$types';

// RFC 9116 disclosure pointer. `Expires` is computed per request (now + 6
// months) so the file never goes stale without a human editing it — RFC 9116
// §2.5.5 treats an expired document as invalid. Trade-off: a rolling value can
// never expire, so it also never signals an unmaintained document. Using the
// address SECURITY.md already documents keeps that from mattering — there is no
// separate mailbox here that could quietly stop delivering.
const CONTACT = 'simon@baerlocher.ch';
const POLICY = 'https://github.com/sbaerlocher/parqet.beer/blob/main/SECURITY.md';
const CANONICAL = 'https://parqet.beer/.well-known/security.txt';
const PREFERRED_LANGUAGES = ['de', 'en'] as const;
const EXPIRES_MONTHS = 6;

export const GET: RequestHandler = () => {
  const expires = new Date();
  expires.setUTCMonth(expires.getUTCMonth() + EXPIRES_MONTHS);

  const body =
    [
      `Contact: mailto:${CONTACT}`,
      `Expires: ${expires.toISOString()}`,
      `Policy: ${POLICY}`,
      `Canonical: ${CANONICAL}`,
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
