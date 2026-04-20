<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { BeverageCategory } from '$lib/data/beverages';
  import { t } from '$lib/stores/locale';

  let { selected = $bindable() }: { selected: BeverageCategory } = $props();

  const categories: { key: BeverageCategory; emoji: string }[] = [
    { key: 'beer', emoji: '🍺' },
    { key: 'coffee', emoji: '☕' },
    { key: 'smoothie', emoji: '🥤' },
  ];
</script>

<div class="flex items-center gap-1 bg-white rounded-lg border border-amber-200 p-1">
  {#each categories as cat (cat.key)}
    <button
      class="px-3 py-1.5 rounded text-sm font-medium transition-all {selected === cat.key
        ? 'bg-amber-600 text-white scale-105'
        : 'text-amber-600 hover:bg-amber-100'}"
      onclick={() => (selected = cat.key)}
    >
      {cat.emoji}
      {$t[cat.key]}
    </button>
  {/each}
</div>
