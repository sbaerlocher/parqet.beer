<script lang="ts">
  import type { Currency } from '$lib/data/beverages';

  let { currency = $bindable() }: { currency: Currency } = $props();
</script>

<div class="inline-flex gap-0.5 bg-amber-100 rounded-full p-0.5">
  <button
    class="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all {currency === 'EUR'
      ? 'bg-amber-600 text-white shadow-sm'
      : 'text-amber-600 hover:text-amber-800'}"
    onclick={() => (currency = 'EUR')}
  >
    EUR
  </button>
  <button
    class="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all {currency === 'CHF'
      ? 'bg-amber-600 text-white shadow-sm'
      : 'text-amber-600 hover:text-amber-800'}"
    onclick={() => (currency = 'CHF')}
  >
    CHF
  </button>
</div>
