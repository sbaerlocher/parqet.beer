<script lang="ts">
  import { locale } from '$lib/stores/locale';
</script>

<div class="flex items-center gap-2 bg-white rounded-lg border border-amber-200 p-1">
  <button
    class="px-3 py-1 rounded text-sm font-medium transition-colors {$locale === 'de'
      ? 'bg-amber-600 text-white'
      : 'text-amber-600 hover:bg-amber-100'}"
    onclick={() => locale.set('de')}
  >
    DE
  </button>
  <button
    class="px-3 py-1 rounded text-sm font-medium transition-colors {$locale === 'en'
      ? 'bg-amber-600 text-white'
      : 'text-amber-600 hover:bg-amber-100'}"
    onclick={() => locale.set('en')}
  >
    EN
  </button>
</div>
