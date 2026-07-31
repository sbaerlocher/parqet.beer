<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { DISPLAY_CURRENCIES, type DisplayCurrency } from '$lib/fx';

  let { currency = $bindable() }: { currency: DisplayCurrency } = $props();
</script>

<div class="inline-flex gap-0.5 bg-amber-100 rounded-full p-0.5">
  {#each DISPLAY_CURRENCIES as c (c)}
    <button
      class="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all {currency === c
        ? 'bg-amber-600 text-white shadow-sm'
        : 'text-amber-600 hover:text-amber-800'}"
      onclick={() => (currency = c)}
    >
      {c}
    </button>
  {/each}
</div>
