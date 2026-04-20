<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { theme } from '$lib/stores/theme';
</script>

<button
  class="inline-flex items-center justify-center w-[30px] h-7 rounded-md transition-colors"
  style="background: var(--accent); border: 1px solid var(--border); color: var(--highlight); font-size: 13px"
  onclick={() => theme.toggle()}
  title={$theme === 'dark' ? 'Light mode' : 'Dark mode'}
  aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {$theme === 'dark' ? '☀' : '☽'}
</button>
