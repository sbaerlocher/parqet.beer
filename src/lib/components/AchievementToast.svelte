<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
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

  // Each fresh unlock becomes a toast that removes itself after a few seconds.
  $effect(() => {
    for (const id of $newlyUnlocked) {
      const achievement = byId.get(id);
      if (!achievement) continue;
      const key = nextKey++;
      toasts = [...toasts, { key, achievement }];
      setTimeout(() => {
        toasts = toasts.filter((t) => t.key !== key);
      }, DISMISS_MS);
    }
  });
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
  {#each toasts as toast (toast.key)}
    <div
      class="flex items-center gap-3 py-2.5 px-4 rounded-lg shadow-lg max-w-xs pointer-events-auto"
      style="background: var(--card); border: 1px solid var(--highlight); color: var(--highlight)"
      transition:fly={{ x: 24, duration: 250 }}
      role="status"
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
