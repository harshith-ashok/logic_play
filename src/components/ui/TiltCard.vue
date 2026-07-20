<script setup lang="ts">
import { ref } from "vue";
import { useTilt } from "@/composables/useTilt";

const el = ref<HTMLElement | null>(null);
useTilt(el, 5);
</script>

<template>
  <div
    ref="el"
    class="tilt-card group relative rounded-2xl border border-border bg-surface p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-hover"
  >
    <div class="glow pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div class="relative">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.tilt-card {
  transform-style: preserve-3d;
}

.glow {
  padding: 1px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent-blue) 45%, transparent),
    color-mix(in srgb, var(--color-accent-violet) 45%, transparent) 60%,
    transparent 90%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
</style>
