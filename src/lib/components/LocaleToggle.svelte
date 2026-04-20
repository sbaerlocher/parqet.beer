<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { locale } from '$lib/stores/locale';
</script>

<div
  class="inline-flex p-0.5 rounded-md"
  style="background: var(--accent); border: 1px solid var(--border)"
>
  <button
    class="px-2.5 py-1 rounded text-[11px] font-bold transition-all font-mono"
    style={$locale === 'de'
      ? 'background: var(--card); color: var(--highlight)'
      : 'background: transparent; color: var(--highlight)'}
    onclick={() => locale.set('de')}
  >
    DE
  </button>
  <button
    class="px-2.5 py-1 rounded text-[11px] font-bold transition-all font-mono"
    style={$locale === 'en'
      ? 'background: var(--card); color: var(--highlight)'
      : 'background: transparent; color: var(--highlight)'}
    onclick={() => locale.set('en')}
  >
    EN
  </button>
</div>
