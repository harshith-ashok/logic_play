<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number;
    opacity?: number;
    color?: string;
  }>(),
  {
    size: 48,
    opacity: 1,
    color: "currentColor",
  },
);

// 9x9 pixel grid sparkle — chunky, blocky rendering of the logo's halftone
// star motif instead of a smooth vector shape. Coordinates as [x, y] cells.
const GRID = 9;
const cells: [number, number][] = [
  [4, 0],
  [4, 1],
  [3, 2],
  [4, 2],
  [5, 2],
  [4, 3],
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [5, 4],
  [6, 4],
  [7, 4],
  [8, 4],
  [4, 5],
  [3, 6],
  [4, 6],
  [5, 6],
  [4, 7],
  [4, 8],
];
</script>

<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${GRID} ${GRID}`"
    shape-rendering="crispEdges"
    :style="{ opacity }"
    aria-hidden="true"
  >
    <rect
      v-for="([x, y], i) in cells"
      :key="i"
      :x="x"
      :y="y"
      width="1"
      height="1"
      :fill="color"
    />
  </svg>
</template>
