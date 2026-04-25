<!-- SPDX-License-Identifier: MIT -->
<script lang="ts">
  import { useGlassFill } from './glass-motion.svelte';

  let { fill = 0.68, size = 180 }: { fill?: number; size?: number } = $props();

  const motion = useGlassFill(() => fill);

  $effect(() => {
    motion.update();
  });

  const liquidY = $derived(40 + (1 - motion.fill) * 180);
</script>

<svg
  width={size}
  height={size * 1.25}
  viewBox="0 0 200 260"
  style="display: block"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="amber-{motion.uid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fcd34d" />
      <stop offset="0.5" stop-color="#f59e0b" />
      <stop offset="1" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="foam-{motion.uid}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fffaf0" />
      <stop offset="1" stop-color="#fde68a" />
    </linearGradient>
    <clipPath id="clip-{motion.uid}">
      <path d="M40 30 L52 240 Q52 250 62 250 L138 250 Q148 250 148 240 L160 30 Z" />
    </clipPath>
  </defs>

  <!-- glass outline -->
  <path
    d="M40 30 L52 240 Q52 250 62 250 L138 250 Q148 250 148 240 L160 30 Z"
    fill="var(--glass-bg)"
    stroke="var(--glass-stroke)"
    stroke-width="3"
  />
  <!-- handle -->
  <path
    d="M160 60 Q190 80 190 140 Q190 210 160 220"
    fill="none"
    stroke="var(--glass-stroke)"
    stroke-width="3"
    stroke-linecap="round"
  />

  <!-- liquid -->
  <g clip-path="url(#clip-{motion.uid})">
    <rect x="30" y={liquidY} width="150" height={260 - liquidY} fill="url(#amber-{motion.uid})" />
  </g>

  <!-- foam -->
  <g clip-path="url(#clip-{motion.uid})">
    <ellipse cx="100" cy={liquidY - 4} rx="62" ry="10" fill="url(#foam-{motion.uid})" />
    <circle cx="72" cy={liquidY - 12} r="8" fill="#fffaf0" opacity="0.9" />
    <circle cx="92" cy={liquidY - 16} r="11" fill="#fffdf7" opacity="0.85" />
    <circle cx="115" cy={liquidY - 12} r="9" fill="#fffaf0" opacity="0.9" />
    <circle cx="132" cy={liquidY - 10} r="7" fill="#fffdf7" opacity="0.85" />
  </g>

  <!-- bubbles -->
  <g clip-path="url(#clip-{motion.uid})">
    {#each [0, 1, 2] as i (i)}
      <circle
        cx={75 + i * 25}
        cy={230}
        r={2 + (i % 2)}
        fill="rgba(255,255,255,0.5)"
        class="beer-bubble"
        style="animation-delay: {i * 0.8}s"
      />
    {/each}
  </g>
</svg>

<style>
  .beer-bubble {
    animation: bubble 3.5s ease-in infinite;
  }

  @keyframes bubble {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.5);
    }
    15% {
      opacity: 0;
      transform: translateY(-30px) scale(0.7);
    }
    20% {
      opacity: 0.5;
    }
    90% {
      opacity: 0.4;
    }
    100% {
      opacity: 0;
      transform: translateY(-160px) scale(1);
    }
  }
</style>
