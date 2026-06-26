<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { formatNumber } from '$lib/calculator';
  import { locale } from '$lib/stores/locale';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>parqet.beer · embed</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<a
  class="widget"
  href="https://parqet.beer"
  target="_blank"
  rel="noopener noreferrer"
  style="background: var(--card); color: var(--ink)"
>
  <span class="emoji" aria-hidden="true">{data.emoji}</span>
  <span class="body">
    <span class="count">{formatNumber(data.count, $locale)} {data.beverageName}</span>
    <span class="caption">
      {#if $locale === 'de'}
        = {formatNumber(data.value, $locale)}
        {data.currency}{data.isDemo ? ' (Demo)' : ''} · parqet.beer
      {:else}
        = {formatNumber(data.value, $locale)}
        {data.currency}{data.isDemo ? ' (demo)' : ''} · parqet.beer
      {/if}
    </span>
  </span>
</a>

<style>
  :global(body) {
    margin: 0;
    background: transparent;
  }

  .widget {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.1rem;
    border: 1.5px solid #f59e0b;
    border-radius: 12px;
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      sans-serif;
    text-decoration: none;
    max-width: 360px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  }

  .emoji {
    font-size: 1.9rem;
    line-height: 1;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .count {
    font-weight: 700;
    font-size: 1.05rem;
  }

  .caption {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
