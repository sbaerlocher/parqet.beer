<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { locale } from '$lib/stores/locale';
  import { all, unlocked, seenIds } from '$lib/stores/achievements';
  import LocaleToggle from '$lib/components/LocaleToggle.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  // Currently-true predicates ∪ everything ever unlocked (persisted in
  // localStorage). The union means a direct load of this page — where the
  // dashboard's `$effect` never runs to feed the store — still shows earned
  // portfolio/beverage badges as unlocked, not locked. This page never fetches.
  const unlockedIds = $derived(new Set([...seenIds, ...$unlocked.map((a) => a.id)]));
</script>

<svelte:head>
  <title>{$locale === 'de' ? 'Erfolge' : 'Achievements'} · parqet.beer</title>
</svelte:head>

<div class="min-h-screen" style="background: var(--paper); color: var(--ink)">
  <div class="max-w-3xl mx-auto px-4 sm:px-7 py-6 pb-15">
    <!-- top bar -->
    <div class="flex justify-between items-center mb-10 sm:mb-15">
      <a href="/" class="flex items-center gap-2.5 no-underline">
        <span
          class="w-7 h-7 rounded-[7px] inline-flex items-center justify-center font-extrabold text-[13px] font-mono"
          style="border: 1.5px solid var(--highlight); background: var(--card); color: var(--highlight); box-shadow: inset 0 0 0 2px var(--card), 0 0 0 1.5px var(--highlight); letter-spacing: -0.03em"
        >
          🍺
        </span>
        <span class="font-display font-bold text-lg"
          >parqet<span class="text-amber-600">.beer</span></span
        >
      </a>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </div>

    <h1 class="font-display font-bold text-2xl mb-1">
      {$locale === 'de' ? 'Erfolge & Streaks' : 'Achievements & Streaks'}
    </h1>
    <p class="text-sm mb-8" style="color: var(--muted)">
      {$locale === 'de'
        ? 'Meilensteine, die du beim Umrechnen deines Portfolios freischaltest.'
        : 'Milestones you unlock as you convert your portfolio.'}
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each all as achievement (achievement.id)}
        {@const isUnlocked = unlockedIds.has(achievement.id)}
        <div
          class="flex items-start gap-3 p-4 rounded-lg transition-opacity"
          class:opacity-40={!isUnlocked}
          style="background: var(--card); border: 1px solid var(--border)"
        >
          <span class="text-2xl shrink-0" aria-hidden="true">
            {isUnlocked ? achievement.icon : '🔒'}
          </span>
          <div class="min-w-0">
            <div class="font-display font-bold text-sm" style="color: var(--highlight)">
              {achievement.title[$locale]}
            </div>
            <div class="text-xs mt-0.5" style="color: var(--muted)">
              {achievement.description[$locale]}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
