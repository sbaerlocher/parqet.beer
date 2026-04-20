<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { Beverage, BeverageCategory } from '$lib/data/beverages';
  import { convertValue, formatNumber } from '$lib/calculator';
  import { locale, t } from '$lib/stores/locale';

  let {
    dividends,
    dividendsCurrency,
    beverage,
    category,
  }: {
    dividends: number;
    dividendsCurrency: string;
    beverage: Beverage;
    category: BeverageCategory;
  } = $props();

  const categoryEmoji: Record<BeverageCategory, string> = {
    beer: '🍻',
    coffee: '☕',
    smoothie: '🥤',
  };

  const count = $derived(
    Math.floor(convertValue(dividends, dividendsCurrency, beverage.currency) / beverage.price)
  );
</script>

{#if dividends > 0 && count > 0}
  <div
    class="rounded-2xl p-5 mb-6"
    style="background: linear-gradient(to right, var(--card), var(--paper)); border: 1px solid var(--border)"
  >
    <div class="flex items-center gap-3 mb-3">
      <span class="text-3xl">💰</span>
      <div>
        <p class="text-sm text-green-700 font-medium">
          {$t.yourDividends}
        </p>
        <p class="text-xs text-green-500">
          {$t.dividendsSubtitle}
        </p>
      </div>
    </div>
    <div class="flex items-end justify-between">
      <div>
        <p class="text-2xl font-display font-bold text-green-800 tabular-nums">
          {formatNumber(Math.round(dividends), $locale)}
          {dividendsCurrency}
        </p>
        <p class="text-sm text-green-600 mt-1">
          = <span class="font-semibold">{formatNumber(count, $locale)} {beverage.name}</span>
          <span class="text-green-400 ml-1">
            {$t.onTheHouse}
          </span>
        </p>
      </div>
      <span class="text-4xl">{categoryEmoji[category]}</span>
    </div>
  </div>
{/if}
