<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { streak } from '$lib/stores/streak';
</script>

{#if $streak > 0}
  <span
    class="inline-flex items-center gap-1 h-7 px-2 rounded-md font-mono tabular-nums text-xs font-bold shrink-0"
    style="background: var(--accent); border: 1px solid var(--border); color: var(--highlight)"
    title={`${$streak}-day streak`}
    aria-label={`${$streak}-day visit streak`}
  >
    <span aria-hidden="true">🔥</span>
    {$streak}
  </span>
{/if}
