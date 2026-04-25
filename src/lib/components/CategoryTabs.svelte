<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { BEVERAGE_CATEGORIES, CATEGORY_EMOJI, type BeverageCategory } from '$lib/data/beverages';
  import { t } from '$lib/stores/locale';

  let { selected = $bindable() }: { selected: BeverageCategory } = $props();
</script>

<div class="flex items-center gap-1 bg-white rounded-lg border border-amber-200 p-1">
  {#each BEVERAGE_CATEGORIES as key (key)}
    <button
      class="px-3 py-1.5 rounded text-sm font-medium transition-all {selected === key
        ? 'bg-amber-600 text-white scale-105'
        : 'text-amber-600 hover:bg-amber-100'}"
      onclick={() => (selected = key)}
    >
      {CATEGORY_EMOJI[key]}
      {$t[key]}
    </button>
  {/each}
</div>
