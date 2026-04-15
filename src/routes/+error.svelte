<script lang="ts">
  import { page } from '$app/stores';
  import { t, locale } from '$lib/stores/locale';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  // Treat anything that isn't 404 as a server-side failure. Route-level
  // errors (400/401/...) are rare in this app — showing the 5xx variant is
  // friendlier than exposing raw messages.
  const is404 = $derived($page.status === 404);
  const emoji = $derived(is404 ? '🕳️' : '💥');
  const errorTitle = $derived(is404 ? $t.error404Title : $t.error500Title);
  const errorMessage = $derived(is404 ? $t.error404Message : $t.error500Message);
  const errorHint = $derived(is404 ? $t.error404Hint : $t.error500Hint);
</script>

<svelte:head>
  <title>{$page.status} · parqet.beer</title>
</svelte:head>

<div class="min-h-screen bg-amber-50 flex flex-col items-center px-4 py-16">
  <div class="absolute top-4 right-4 flex items-center gap-2">
    <ThemeToggle />
    <LocaleToggle />
  </div>

  <div class="max-w-lg text-center flex-1 flex flex-col justify-center">
    <div class="text-8xl mb-4" aria-hidden="true">{emoji}</div>

    <p
      class="text-sm font-semibold tracking-widest uppercase text-amber-600 mb-3"
      aria-label="{$t.errorStatusLabel} {$page.status}"
    >
      {$t.errorStatusLabel} · {$page.status}
    </p>

    <h1 class="text-4xl sm:text-5xl font-bold text-amber-900 mb-4">{errorTitle}</h1>
    <p class="text-xl text-amber-700 mb-2">{errorMessage}</p>
    <p class="text-amber-600 mb-8">{errorHint}</p>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <a
        href="/"
        class="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        ← {$t.errorBackHome}
      </a>
      {#if !is404}
        <button
          type="button"
          onclick={() => location.reload()}
          class="inline-flex items-center gap-2 bg-white hover:bg-amber-100 text-amber-800 font-semibold px-6 py-3 rounded-lg border border-amber-300 transition-colors"
        >
          ↻ {$t.errorTryAgain}
        </button>
      {/if}
    </div>
  </div>

  <footer class="mt-12 text-center text-xs text-amber-400 space-y-1 px-4">
    <p>{$t.disclaimer3}</p>
    <div class="flex items-center justify-center gap-3 pt-1 text-amber-300">
      <a href="/privacy" class="hover:text-amber-500 transition-colors"
        >{$locale === 'de' ? 'Datenschutz' : 'Privacy'}</a
      >
      <span>·</span>
      <a
        href="https://github.com/sbaerlocher/parqet.beer"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-amber-500 transition-colors">GitHub</a
      >
    </div>
  </footer>
</div>
