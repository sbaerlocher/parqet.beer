<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import type { LocalizedNote } from '$lib/data/beverages';
  import { locale } from '$lib/stores/locale';

  type Variant = 'prominent' | 'full' | 'icon';

  let {
    note,
    variant = 'full',
  }: {
    note: LocalizedNote;
    variant?: Variant;
  } = $props();

  const text = $derived(note[$locale]);
</script>

{#if variant === 'prominent'}
  <span
    class="font-mono text-[12px] py-1 px-2.5 rounded-full font-semibold tracking-wide inline-flex items-center gap-1"
    style="background: var(--amber-600, #d97706); color: #fffdf7"
    aria-label={text}
  >
    <span aria-hidden="true">♥</span>
    <span>{text}</span>
  </span>
{:else if variant === 'icon'}
  <span
    class="font-mono text-[11px] py-0.5 px-1.5 rounded font-semibold tracking-wide shrink-0"
    style="background: var(--accent); color: var(--amber-800, #92400e); border: 1px solid var(--border)"
    aria-label={text}
    title={text}
  >
    <span aria-hidden="true">♥</span>
  </span>
{:else}
  <span
    class="font-mono text-[11px] py-0.5 px-2 rounded font-semibold tracking-wide inline-flex items-center gap-1"
    style="background: var(--accent); color: var(--amber-800, #92400e); border: 1px solid var(--border)"
    aria-label={text}
  >
    <span aria-hidden="true">♥</span>
    <span>{text}</span>
  </span>
{/if}
