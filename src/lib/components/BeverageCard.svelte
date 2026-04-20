<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { BeverageEquivalent } from '$lib/calculator';
  import { formatNumber } from '$lib/calculator';
  import type { Currency } from '$lib/data/beverages';
  import { locale } from '$lib/stores/locale';

  let {
    equiv,
    currency,
    maxCount = 0,
  }: {
    equiv: BeverageEquivalent;
    currency: Currency;
    maxCount?: number;
  } = $props();

  const percent = $derived(maxCount > 0 ? (equiv.count / maxCount) * 100 : 0);
</script>

<div
  class="bg-white rounded-xl border border-amber-200 p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-amber-300"
>
  <div class="flex items-center justify-between mb-2">
    <h3 class="font-semibold text-amber-900">{equiv.name}</h3>
    <span class="text-xs text-amber-400 bg-amber-50 px-2 py-0.5 rounded-full">{equiv.size}</span>
  </div>
  <div class="flex items-end justify-between mb-2">
    <p class="text-2xl font-display font-bold text-slate-800 tabular-nums">
      {formatNumber(equiv.count, $locale)}
    </p>
    <p class="text-sm text-amber-500 tabular-nums">
      {equiv.price.toFixed(2)}
      {currency}
    </p>
  </div>
  {#if maxCount > 0}
    <div class="w-full bg-amber-100 rounded-full h-1.5">
      <div
        class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
        style="width: {Math.min(percent, 100)}%"
      ></div>
    </div>
  {/if}
</div>
