<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { useGlassFill } from './glass-motion.svelte';

  let { fill = 0.68, size = 140 }: { fill?: number; size?: number } = $props();

  const motion = useGlassFill(() => fill);

  $effect(() => {
    motion.update();
  });
</script>

<svg
  width={size}
  height={size * 1.21}
  viewBox="0 0 140 170"
  style="display: block"
  aria-hidden="true"
>
  <defs>
    <clipPath id="smoo-clip">
      <path d="M30 30 L36 150 Q37 158 45 158 L95 158 Q103 158 104 150 L110 30 Z" />
    </clipPath>
  </defs>

  <!-- glass -->
  <path
    d="M30 30 L36 150 Q37 158 45 158 L95 158 Q103 158 104 150 L110 30 Z"
    fill="var(--glass-bg)"
    stroke="var(--glass-stroke)"
    stroke-width="2.5"
  />

  <!-- layers -->
  <g clip-path="url(#smoo-clip)">
    <!-- purple base -->
    <rect x="25" y={60 + (1 - motion.fill) * 90} width="95" height="120" fill="#7c3aed" />
    <!-- pink middle -->
    <rect x="25" y={85 + (1 - motion.fill) * 60} width="95" height="60" fill="#ec4899" />
    <!-- green top -->
    <rect x="25" y={110 + (1 - motion.fill) * 30} width="95" height="50" fill="#84cc16" />
  </g>

  <!-- straw -->
  <rect
    x="75"
    y="8"
    width="8"
    height="60"
    fill="#ec4899"
    stroke="var(--glass-stroke)"
    stroke-width="1.5"
    rx="2"
  />

  <!-- cap line -->
  <ellipse
    cx="70"
    cy="30"
    rx="40"
    ry="4"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="2"
  />
</svg>
