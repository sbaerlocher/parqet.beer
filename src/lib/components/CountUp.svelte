<script lang="ts">
  import { formatNumber } from '$lib/calculator';
  import { locale } from '$lib/stores/locale';
  import { untrack } from 'svelte';

  let { value, duration = 1200 }: { value: number; duration?: number } = $props();

  let displayed = $state(0);
  let frameId = 0;

  $effect(() => {
    const target = value;
    const start = untrack(() => displayed);
    const diff = target - start;

    if (diff === 0) return;

    cancelAnimationFrame(frameId);
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      displayed = Math.round(start + diff * eased);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  });
</script>

<span>{formatNumber(displayed, $locale)}</span>
