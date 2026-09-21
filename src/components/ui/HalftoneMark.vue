<script setup lang="ts">
// Circuit-node diamond used for empty states and decoration (matches the
// pulsing nodes on the page grid). Props kept from the previous mark.
withDefaults(defineProps<{ size?: number; opacity?: number; color?: string }>(), {
  size: 24,
  opacity: 1,
  color: "currentColor",
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :style="{ opacity, color }"
    aria-hidden="true"
  >
    <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" stroke="currentColor" stroke-width="1.5" />
    <rect x="10" y="10" width="4" height="4" transform="rotate(45 12 12)" fill="currentColor" />
  </svg>
</template>
