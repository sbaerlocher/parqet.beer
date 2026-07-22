// SPDX-License-Identifier: MIT
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DEMO_DATA } from '$lib/demo';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Demo mode is a public, read-only showcase — no session required. It lets
  // first-time visitors see the dashboard before connecting Parqet.
  const demo = url.searchParams.get('demo') === '1';
  if (demo) {
    return { demo: true as const, demoData: DEMO_DATA };
  }

  if (!locals.session) {
    redirect(302, '/');
  }

  return { demo: false as const };
};
