<script lang="ts">
  import type { Beverage, Currency } from '$lib/data/beverages';
  import { formatNumber } from '$lib/calculator';
  import { locale } from '$lib/stores/locale';

  let {
    beverage,
    quote,
    count,
    currency,
  }: {
    beverage: Beverage;
    quote: string;
    count: number;
    currency: Currency;
  } = $props();

  const price = $derived(currency === 'CHF' ? beverage.priceChf : beverage.priceEur);
</script>

<div
  class="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl border border-amber-300 p-5 mb-6 relative overflow-hidden"
>
  <div class="absolute top-3 right-4 text-4xl opacity-30">🎩</div>
  <p class="text-sm text-amber-600 mb-2 italic">{quote}</p>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-xl font-bold text-amber-900">{beverage.name}</p>
      <p class="text-sm text-amber-600">{beverage.size} · {price.toFixed(2)} {currency}</p>
    </div>
    <div class="text-right">
      <p class="text-3xl font-display font-bold text-slate-800 tabular-nums">
        {formatNumber(count, $locale)}
      </p>
      <p class="text-xs text-amber-500">{$locale === 'de' ? 'Stück' : 'units'}</p>
    </div>
  </div>
  <p class="text-xs text-amber-400 mt-3 italic">
    {$locale === 'de' ? "Morgen gibt's eine neue Empfehlung" : 'New recommendation tomorrow'}
  </p>
</div>
