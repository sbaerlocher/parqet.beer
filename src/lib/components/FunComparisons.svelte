<script lang="ts">
  import type { BeverageCategory } from '$lib/data/beverages';
  import { getFunComparisons } from '$lib/fun';
  import { locale } from '$lib/stores/locale';

  let { count, category }: { count: number; category: BeverageCategory } = $props();

  const comparisons = $derived(getFunComparisons(count, category, $locale));

  interface ArrangedTile {
    emoji: string;
    number: string;
    label: string;
    highlight: boolean;
    matched: boolean;
  }

  // Build rows: each big tile (2 cols) pairs with 1 small tile (1 col) = full row of 3
  // Remaining smalls fill rows of 3. Alternate big tile position (left/right).
  const rows = $derived.by(() => {
    const small = comparisons.filter((c) => !c.highlight);
    const big = comparisons.filter((c) => c.highlight);
    const result: ArrangedTile[][] = [];
    let si = 0;
    for (let bi = 0; bi < big.length; bi++) {
      const bigTile = big[bi];
      if (!bigTile) continue;
      const smallTile = small[si];
      if (smallTile) {
        si++;
        // Alternate: even = [small, BIG], odd = [BIG, small]
        result.push(bi % 2 === 0 ? [smallTile, bigTile] : [bigTile, smallTile]);
      } else {
        result.push([bigTile]);
      }
    }
    // Remaining smalls in rows of 3
    while (si < small.length) {
      const row: ArrangedTile[] = [];
      for (let j = 0; j < 3 && si < small.length; j++) {
        const tile = small[si++];
        if (tile) row.push(tile);
      }
      result.push(row);
    }
    return result;
  });
</script>

{#if rows.length > 0}
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
    {#each rows as row, rowIndex (rowIndex)}
      {#each row as c (c.label)}
        {#if c.highlight}
          <div
            class="rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md col-span-2 bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-300 p-5 flex items-center gap-4"
          >
            <span class="text-4xl">{c.emoji}</span>
            <div>
              <p class="text-3xl font-display font-bold text-slate-800 tabular-nums">{c.number}</p>
              <p class="text-sm text-amber-600 mt-0.5 leading-snug">{c.label}</p>
            </div>
          </div>
        {:else}
          <div
            class="rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md bg-white border border-amber-200 p-4"
          >
            <span class="text-2xl block mb-1">{c.emoji}</span>
            <p class="text-2xl font-display font-bold text-slate-800 tabular-nums">{c.number}</p>
            <p class="text-xs text-amber-600 mt-0.5 leading-snug">{c.label}</p>
          </div>
        {/if}
      {/each}
    {/each}
  </div>
{/if}
