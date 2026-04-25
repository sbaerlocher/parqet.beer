<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { useGlassFill } from './glass-motion.svelte';

  let { fill = 0.68, size = 140 }: { fill?: number; size?: number } = $props();

  const motion = useGlassFill(() => fill);

  $effect(() => {
    motion.update();
  });

  const liquidY = $derived(70 + (1 - motion.fill) * 110);
</script>

<svg
  width={size}
  height={size * 1.21}
  viewBox="0 0 140 170"
  style="display: block"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="cup-coffee" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#78350f" />
      <stop offset="1" stop-color="#451a03" />
    </linearGradient>
    <clipPath id="cup-clip">
      <path d="M30 50 L35 145 Q36 155 46 155 L94 155 Q104 155 105 145 L110 50 Z" />
    </clipPath>
  </defs>

  <!-- saucer -->
  <ellipse
    cx="70"
    cy="162"
    rx="50"
    ry="6"
    fill="var(--accent)"
    stroke="var(--glass-stroke)"
    stroke-width="1.5"
  />

  <!-- cup -->
  <path
    d="M30 50 L35 145 Q36 155 46 155 L94 155 Q104 155 105 145 L110 50 Z"
    fill="var(--card)"
    stroke="var(--glass-stroke)"
    stroke-width="2.5"
  />

  <!-- handle -->
  <path
    d="M110 70 Q130 85 130 110 Q130 135 108 140"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="2.5"
    stroke-linecap="round"
  />

  <!-- liquid -->
  <g clip-path="url(#cup-clip)">
    <rect x="25" y={liquidY} width="95" height="120" fill="url(#cup-coffee)" />
    <ellipse cx="70" cy={liquidY} rx="42" ry="3" fill="#92400e" />
  </g>

  <!-- steam -->
  <path
    d="M55 45 Q50 30 58 15 Q62 5 55 -5"
    fill="none"
    stroke="var(--steam)"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0.6"
  >
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0,0;2,-3;0,0;-2,-3;0,0"
      dur="4s"
      repeatCount="indefinite"
    />
  </path>
  <path
    d="M70 45 Q66 28 74 12 Q78 3 70 -5"
    fill="none"
    stroke="var(--steam)"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0.5"
  >
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0,0;-2,-3;0,0;2,-3;0,0"
      dur="3.5s"
      repeatCount="indefinite"
    />
  </path>
  <path
    d="M85 45 Q80 30 88 15 Q92 5 85 -5"
    fill="none"
    stroke="var(--steam)"
    stroke-width="2"
    stroke-linecap="round"
    opacity="0.6"
  >
    <animateTransform
      attributeName="transform"
      type="translate"
      values="0,0;2,-2;0,0;-2,-2;0,0"
      dur="4.5s"
      repeatCount="indefinite"
    />
  </path>
</svg>
