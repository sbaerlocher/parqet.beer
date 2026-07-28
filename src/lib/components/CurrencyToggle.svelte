<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { SUPPORTED_CURRENCIES, type Currency } from '$lib/data/beverages';

  let { currency = $bindable() }: { currency: Currency } = $props();
</script>

<div
  class="inline-flex p-0.5 rounded-md"
  style="background: var(--accent); border: 1px solid var(--border)"
>
  {#each SUPPORTED_CURRENCIES as c (c)}
    <button
      onclick={() => (currency = c)}
      class="px-2 sm:px-2.5 py-1 rounded text-[11px] font-bold transition-all font-mono"
      style={currency === c
        ? 'background: var(--card); color: var(--highlight)'
        : 'background: transparent; color: var(--highlight)'}
      aria-pressed={currency === c}
    >
      {c}
    </button>
  {/each}
</div>
