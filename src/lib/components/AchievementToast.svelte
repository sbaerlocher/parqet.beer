<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { newlyUnlocked, all } from '$lib/stores/achievements';
  import { locale } from '$lib/stores/locale';
  import type { Achievement, AchievementId } from '$lib/achievements';

  const DISMISS_MS = 4000;

  const byId = new Map<AchievementId, Achievement>(all.map((a) => [a.id, a]));

  interface Toast {
    key: number;
    achievement: Achievement;
  }

  let toasts = $state<Toast[]>([]);
  let nextKey = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  // Each fresh unlock becomes a toast that removes itself after a few seconds.
  // `untrack` the toasts read/write: without it the effect depends on `toasts`,
  // and appending re-runs it while `$newlyUnlocked` still holds the same array,
  // looping until `effect_update_depth_exceeded` on the one path that matters.
  $effect(() => {
    const fresh = $newlyUnlocked;
    if (fresh.length === 0) return;
    untrack(() => {
      for (const id of fresh) {
        const achievement = byId.get(id);
        if (!achievement) continue;
        const key = nextKey++;
        toasts = [...toasts, { key, achievement }];
        const timer = setTimeout(() => {
          toasts = toasts.filter((t) => t.key !== key);
          timers.delete(timer);
        }, DISMISS_MS);
        timers.add(timer);
      }
    });
  });

  // Don't leave timers firing into a destroyed component after navigation.
  $effect(() => () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  });
</script>

<!-- Live region lives on the always-present container: an ARIA status node has
  to be in the tree before the mutation to be announced reliably (Safari/VO
  drops role="status" that arrives on the inserted node itself). -->
<div
  class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
  role="status"
  aria-live="polite"
>
  {#each toasts as toast (toast.key)}
    <div
      class="flex items-center gap-3 py-2.5 px-4 rounded-lg shadow-lg max-w-xs pointer-events-auto"
      style="background: var(--card); border: 1px solid var(--highlight); color: var(--highlight)"
      transition:fly={{ x: 24, duration: 250 }}
    >
      <span class="text-2xl shrink-0" aria-hidden="true">{toast.achievement.icon}</span>
      <div class="min-w-0">
        <div class="font-display font-bold text-sm">{toast.achievement.title[$locale]}</div>
        <div class="text-xs" style="color: var(--muted)">
          {toast.achievement.description[$locale]}
        </div>
      </div>
    </div>
  {/each}
</div>
