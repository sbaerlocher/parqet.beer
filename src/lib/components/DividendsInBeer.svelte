<script lang="ts">
  import type { Beverage, BeverageCategory, Currency } from '$lib/data/beverages';
  import { formatNumber } from '$lib/calculator';
  import { locale } from '$lib/stores/locale';

  let {
    dividends,
    beverage,
    currency,
    category,
  }: {
    dividends: number;
    beverage: Beverage;
    currency: Currency;
    category: BeverageCategory;
  } = $props();

  const categoryEmoji: Record<BeverageCategory, string> = {
    beer: '🍻',
    coffee: '☕',
    smoothie: '🥤',
  };

  const price = $derived(currency === 'CHF' ? beverage.priceChf : beverage.priceEur);
  const count = $derived(Math.floor(dividends / price));
</script>

{#if dividends > 0 && count > 0}
  <div
    class="bg-gradient-to-r from-green-50 to-amber-50 rounded-2xl border border-green-300 p-5 mb-6"
  >
    <div class="flex items-center gap-3 mb-3">
      <span class="text-3xl">💰</span>
      <div>
        <p class="text-sm text-green-700 font-medium">
          {$locale === 'de' ? 'Deine Dividenden' : 'Your dividends'}
        </p>
        <p class="text-xs text-green-500">
          {$locale === 'de'
            ? 'Ausschüttungen der letzten 12 Monate'
            : 'Distributions over the last 12 months'}
        </p>
      </div>
    </div>
    <div class="flex items-end justify-between">
      <div>
        <p class="text-2xl font-display font-bold text-green-800 tabular-nums">
          {formatNumber(Math.round(dividends), $locale)}
          {currency}
        </p>
        <p class="text-sm text-green-600 mt-1">
          = <span class="font-semibold">{formatNumber(count, $locale)} {beverage.name}</span>
          <span class="text-green-400 ml-1">
            {$locale === 'de' ? 'gratis dazu' : 'on the house'}
          </span>
        </p>
      </div>
      <span class="text-4xl">{categoryEmoji[category]}</span>
    </div>
  </div>
{/if}
