<script setup lang="ts">
import { onMounted, ref } from "vue";
import bigLogo from "../../assets/brand/wordmark.webp";

const emit = defineEmits<{ done: [] }>();
const hiding = ref(false);

// Pure CSS: logo rises in, a red bar fills, then the overlay fades. Total
// ~1s and it never waits for `window.load`, so it can't hold the page hostage.
onMounted(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => (hiding.value = true), reduced ? 0 : 900);
  window.setTimeout(() => emit("done"), reduced ? 0 : 1400);
});
</script>

<template>
  <div
    class="fixed inset-0 z-200 grid place-items-center bg-bg transition-opacity duration-500"
    :class="hiding && 'pointer-events-none opacity-0'"
    aria-hidden="true"
  >
    <div class="overflow-hidden">
      <img
        :src="bigLogo"
        alt=""
        class="brand-mark h-14 w-auto [transform:translate3d(0,110%,0)] sm:h-16"
        style="animation: wordUp 0.7s var(--ease-spring) 0.05s forwards"
      />
    </div>
    <div
      class="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent"
      style="animation: loaderBar 0.9s var(--ease-mechanical) forwards"
    />
  </div>
</template>

<style scoped>
@keyframes loaderBar {
  to {
    transform: scaleX(1);
  }
}
</style>
