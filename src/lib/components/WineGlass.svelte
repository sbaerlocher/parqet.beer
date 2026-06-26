<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { useGlassFill } from './glass-motion.svelte';

  let { fill = 0.6, size = 140 }: { fill?: number; size?: number } = $props();

  const motion = useGlassFill(() => fill);

  $effect(() => {
    motion.update();
  });

  // Bowl spans y≈30 (rim) to y≈120 (base of bowl). Liquid rises within it.
  const liquidY = $derived(38 + (1 - motion.fill) * 78);
</script>

<svg
  width={size}
  height={size * 1.15}
  viewBox="0 0 160 185"
  style="display: block"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="wine-{motion.uid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#9f1239" />
      <stop offset="0.55" stop-color="#7f1d3a" />
      <stop offset="1" stop-color="#581c2b" />
    </linearGradient>
    <clipPath id="bowl-{motion.uid}">
      <!-- Rounded bowl: wide rim tapering to a narrow neck. -->
      <path d="M44 32 Q44 116 80 120 Q116 116 116 32 Z" />
    </clipPath>
  </defs>

  <!-- bowl -->
  <path
    d="M44 32 Q44 116 80 120 Q116 116 116 32 Z"
    fill="var(--glass-bg)"
    stroke="var(--glass-stroke)"
    stroke-width="2.5"
  />

  <!-- liquid -->
  <g clip-path="url(#bowl-{motion.uid})">
    <rect x="40" y={liquidY} width="80" height={120 - liquidY} fill="url(#wine-{motion.uid})" />
    <ellipse cx="80" cy={liquidY} rx="36" ry="2.5" fill="#be123c" opacity="0.55" />
  </g>

  <!-- stem -->
  <rect x="78" y="120" width="4" height="38" fill="var(--glass-stroke)" opacity="0.7" />

  <!-- foot -->
  <ellipse
    cx="80"
    cy="160"
    rx="26"
    ry="5"
    fill="var(--glass-bg)"
    stroke="var(--glass-stroke)"
    stroke-width="2"
  />

  <!-- rim highlight -->
  <ellipse
    cx="80"
    cy="32"
    rx="36"
    ry="3"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="1.5"
    opacity="0.6"
  />
</svg>
