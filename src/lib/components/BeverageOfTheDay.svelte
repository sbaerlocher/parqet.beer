<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { Beverage } from '$lib/data/beverages';
  import { formatNumber } from '$lib/calculator';
  import { locale, t } from '$lib/stores/locale';

  let {
    beverage,
    quote,
    count,
  }: {
    beverage: Beverage;
    quote: string;
    count: number;
  } = $props();
</script>

<div
  class="rounded-2xl p-5 mb-6 relative overflow-hidden"
  style="background: linear-gradient(to bottom right, var(--accent), var(--paper)); border: 1px solid var(--border)"
>
  <div class="absolute top-3 right-4 text-4xl opacity-30">🎩</div>
  <p class="text-sm text-amber-600 mb-2 italic">{quote}</p>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-xl font-bold text-amber-900">{beverage.name}</p>
      <p class="text-sm text-amber-600">
        {beverage.size} · {beverage.price.toFixed(2)}
        {beverage.currency}
      </p>
    </div>
    <div class="text-right">
      <p class="text-3xl font-display font-bold text-slate-800 tabular-nums">
        {formatNumber(count, $locale)}
      </p>
      <p class="text-xs text-amber-500">{$t.units}</p>
    </div>
  </div>
  <p class="text-xs text-amber-400 mt-3 italic">
    {$t.newRecommendation}
  </p>
</div>
