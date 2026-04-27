// SPDX-License-Identifier: MIT
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

// Shared fill-animation helper for BeerGlass / CoffeeGlass / SmoothieGlass /
// WhiskyGlass. Animates a single fill ratio in [0.05, 0.95]; each glass
// projects it into its own SVG coordinates (usually `topY + (1 - fill) * range`).
// `uid` is per-instance for SVG id suffixes (gradients, clipPaths).
export function useGlassFill(getFill: () => number, initialFill = 0.68) {
  const uid = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
  const animated = new Tween(initialFill, { duration: 800, easing: cubicOut });
  const clamp = (n: number) => Math.max(0.05, Math.min(0.95, n));

  return {
    uid,
    /** Drive the tween — call from a `$effect`. */
    update() {
      animated.set(clamp(getFill()));
    },
    /** Animated fill ratio in [0.05, 0.95]. */
    get fill() {
      return animated.current;
    },
  };
}
