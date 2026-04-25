<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { useGlassFill } from './glass-motion.svelte';

  let { fill = 0.68, size = 140 }: { fill?: number; size?: number } = $props();

  const motion = useGlassFill(() => fill);

  $effect(() => {
    motion.update();
  });

  const liquidY = $derived(40 + (1 - motion.fill) * 120);
  // Fade ice cubes in smoothly between fill 0.10 and 0.25 so they don't pop
  // when the user crosses a milestone threshold.
  const iceOpacity = $derived(Math.max(0, Math.min(1, (motion.fill - 0.1) / 0.15)));
</script>

<svg
  width={size}
  height={size * 1.15}
  viewBox="0 0 160 185"
  style="display: block"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="whisky-{motion.uid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#d97706" />
      <stop offset="0.5" stop-color="#b45309" />
      <stop offset="1" stop-color="#78350f" />
    </linearGradient>
    <clipPath id="tumbler-{motion.uid}">
      <path d="M28 35 L30 165 Q31 172 39 172 L121 172 Q129 172 130 165 L132 35 Z" />
    </clipPath>
  </defs>

  <!-- tumbler body -->
  <path
    d="M28 35 L30 165 Q31 172 39 172 L121 172 Q129 172 130 165 L132 35 Z"
    fill="var(--glass-bg)"
    stroke="var(--glass-stroke)"
    stroke-width="2.5"
  />

  <!-- thick-glass bottom accent -->
  <ellipse
    cx="80"
    cy="165"
    rx="46"
    ry="4"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="1.5"
    opacity="0.45"
  />

  <!-- liquid -->
  <g clip-path="url(#tumbler-{motion.uid})">
    <rect x="28" y={liquidY} width="104" height={172 - liquidY} fill="url(#whisky-{motion.uid})" />
    <ellipse cx="80" cy={liquidY} rx="50" ry="2.5" fill="#fbbf24" opacity="0.55" />
  </g>

  <!-- ice cube -->
  <g clip-path="url(#tumbler-{motion.uid})" opacity={iceOpacity}>
    <rect
      x="62"
      y={liquidY + 4}
      width="20"
      height="20"
      fill="#ffffff"
      opacity="0.55"
      rx="2"
      transform="rotate(-8 72 {liquidY + 14})"
    />
    <rect
      x="82"
      y={liquidY + 8}
      width="16"
      height="16"
      fill="#ffffff"
      opacity="0.4"
      rx="2"
      transform="rotate(12 90 {liquidY + 16})"
    />
  </g>

  <!-- rim highlight -->
  <ellipse
    cx="80"
    cy="35"
    rx="52"
    ry="3"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="1.5"
    opacity="0.6"
  />
</svg>
