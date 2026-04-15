<script lang="ts">
  import type { FunStats as FunStatsType } from '$lib/calculator';
  import CountUp from '$lib/components/CountUp.svelte';
  import { t } from '$lib/stores/locale';
  import { locale } from '$lib/stores/locale';

  let { stats, beverageName }: { stats: FunStatsType; beverageName: string } = $props();

  type TimeKey = 'perDay' | 'perWeek' | 'perMonth' | 'perYear';

  const keys: TimeKey[] = ['perDay', 'perWeek', 'perMonth', 'perYear'];
  let selected: TimeKey = $state('perDay');

  const currentValue = $derived(stats[selected]);
</script>

<div class="bg-white rounded-2xl border border-amber-200 p-5 mb-6 text-center">
  <p class="text-xs text-amber-500 mb-2">
    {$locale === 'de'
      ? 'Wenn du ein ganzes Jahr lang trinkst...'
      : 'If you drink for a whole year...'}
  </p>
  <p class="text-5xl font-display font-bold text-slate-800 tabular-nums mb-1">
    <CountUp value={currentValue} />
  </p>
  <p class="text-sm text-amber-700 mb-1">{beverageName} {$t[selected]}</p>

  <div class="inline-flex gap-1 bg-amber-50 rounded-lg p-1 mt-3">
    {#each keys as key (key)}
      <button
        class="px-3 py-1.5 rounded-md text-xs font-medium transition-all {selected === key
          ? 'bg-amber-600 text-white shadow-sm'
          : 'text-amber-600 hover:bg-amber-100'}"
        onclick={() => (selected = key)}
      >
        {$t[key]}
      </button>
    {/each}
  </div>
</div>
