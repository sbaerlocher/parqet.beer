<script lang="ts">
  import type { BeverageCategory } from '$lib/data/beverages';
  import { getMilestoneBadge } from '$lib/fun';
  import { locale } from '$lib/stores/locale';

  let { count, category }: { count: number; category: BeverageCategory } = $props();

  const badge = $derived(getMilestoneBadge(count, category, $locale));
</script>

{#if badge}
  <div class="bg-white rounded-xl border-2 border-amber-400 p-4 mb-6 flex items-center gap-4">
    <span class="text-4xl">{badge.icon}</span>
    <div>
      <p class="font-bold text-amber-900">{badge.title}</p>
      <p class="text-sm text-amber-600">{badge.description}</p>
    </div>
  </div>
{/if}
