// SPDX-License-Identifier: MIT
import type { LayoutServerLoad } from './$types';

// SSR locale-handoff: `hooks.server.ts` resolves the `locale` cookie into
// `event.locals.locale` on every request. We surface it here so the root
// layout can seed the client-side locale store on first render, matching the
// `<html lang>` attribute the server already rendered and avoiding a
// post-hydration flash when the client prefers a different language.
export const load: LayoutServerLoad = ({ locals }) => {
  return {
    locale: locals.locale ?? 'de',
  };
};
