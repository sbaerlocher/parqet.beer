<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { untrack, type Snippet } from 'svelte';
  import { locale, t } from '$lib/stores/locale';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  // Seed the locale store from the SSR payload. Effects don't execute on
  // the server, so the only way to influence SSR output is a synchronous
  // call during rendering. Without this, pages like `/privacy` (which
  // read `$locale` directly for their entire copy) render in the
  // module-default locale on the server and then flash to the cookie
  // locale once hydration runs. `untrack` tells Svelte we intentionally
  // want the current value without setting up a reactive dependency.
  //
  // Module-global store sharing across concurrent SSR renders is only
  // safe because Cloudflare Workers isolates serialize requests; if we
  // ever deploy to a runtime with in-process parallel SSR, move the
  // locale into SvelteKit context instead.
  if (!browser) {
    untrack(() => locale.init(data.locale));
  }

  // Client: reconcile the store with `data.locale` on every navigation so
  // an SSR-locale-change (e.g. user rotated the `locale` cookie via an
  // external mechanism) lands in the store on the next render pass.
  $effect.pre(() => {
    locale.init(data.locale);
  });

  $effect(() => {
    document.documentElement.lang = $locale;
  });

  // Hydration marker. SSR does not set this attribute, so the presence of
  // `html[data-hydrated]` is a reliable signal that client-side event
  // handlers (onclick, etc.) have been attached — which the e2e suite
  // depends on before simulating user interaction.
  $effect(() => {
    document.documentElement.setAttribute('data-hydrated', '');
  });
</script>

<svelte:head>
  <title>parqet.beer — {$t.tagline}</title>
  <meta name="description" content={$t.tagline} />
</svelte:head>

{@render children()}
