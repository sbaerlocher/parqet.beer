<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  let { taglines }: { taglines: string[] } = $props();

  let index = $state(0);
  let visible = $state(true);

  $effect(() => {
    const interval = setInterval(() => {
      visible = false;
      setTimeout(() => {
        index = (index + 1) % taglines.length;
        visible = true;
      }, 350);
    }, 3200);
    return () => clearInterval(interval);
  });

  const current = $derived(taglines[index % taglines.length]);
</script>

<div
  class="transition-all duration-300"
  style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? '0' : '-4px'})"
>
  {current}
</div>
