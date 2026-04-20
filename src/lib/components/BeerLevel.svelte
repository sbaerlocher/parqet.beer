<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { BeverageCategory } from '$lib/data/beverages';
  import { getMilestoneBadge, getNextMilestone, getAllBadges } from '$lib/fun';
  import { locale, t } from '$lib/stores/locale';
  import { formatNumber } from '$lib/calculator';

  let { count, category }: { count: number; category: BeverageCategory } = $props();

  const badge = $derived(getMilestoneBadge(count, category, $locale));
  const next = $derived(getNextMilestone(count, category, $locale));
  const allBadges = $derived(getAllBadges(category, $locale));

  const progress = $derived(
    badge && next
      ? ((count - badge.threshold) / (next.threshold - badge.threshold)) * 100
      : badge && !next
        ? 100
        : 0
  );

  const isMax = $derived(badge && !next);
</script>

{#if badge}
  <div
    class="rounded-2xl p-5 mb-6"
    style="background: var(--card); border: 2px solid {isMax
      ? 'var(--accent-hover)'
      : 'var(--border)'}; {isMax ? 'box-shadow: 0 0 15px rgba(217, 119, 6, 0.15)' : ''}"
  >
    <div class="flex items-center gap-4 mb-4">
      <span class="text-4xl">{badge.icon}</span>
      <div class="flex-1">
        <p class="font-bold text-amber-900 text-lg">{badge.title}</p>
        <p class="text-sm text-amber-600">{badge.description}</p>
      </div>
    </div>

    <!-- All stages -->
    <div class="flex items-center gap-1 mb-3">
      {#each allBadges as b (b.threshold)}
        <div class="flex-1 flex flex-col items-center gap-1">
          <span
            class="text-lg {count >= b.threshold
              ? 'opacity-100'
              : 'opacity-25 grayscale'} transition-all"
          >
            {b.icon}
          </span>
          <div
            class="w-full h-1.5 rounded-full transition-colors"
            style="background: {count >= b.threshold ? 'var(--highlight-soft)' : 'var(--accent)'}"
          ></div>
        </div>
      {/each}
    </div>

    {#if next}
      <div class="flex justify-between text-xs text-amber-500 mb-1">
        <span>{formatNumber(count, $locale)}</span>
        <span>{next.icon} {next.title} ({formatNumber(next.threshold, $locale)})</span>
      </div>
      <div class="w-full rounded-full h-2" style="background: var(--accent)">
        <div
          class="h-2 rounded-full transition-all duration-500"
          style="width: {Math.min(progress, 100)}%; background: var(--highlight-soft)"
        ></div>
      </div>
    {:else}
      <p class="text-xs text-amber-500 text-center mt-1">
        {$t.maxLevelReached} 👑
      </p>
    {/if}
  </div>
{/if}
