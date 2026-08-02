<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gsap } from "gsap";
import bigLogo from "../../assets/svgs/white_big.svg";

const emit = defineEmits<{ done: [] }>();

const root = ref<HTMLElement | null>(null);
const logo = ref<HTMLImageElement | null>(null);

onMounted(() => {
  if (!root.value || !logo.value) return;

  document.documentElement.style.overflow = "hidden";

  gsap.set(logo.value, { opacity: 0, scale: 0.75 });

  const tl = gsap.timeline({
    onComplete: () => {
      document.documentElement.style.overflow = "";
      emit("done");
    },
  });

  // Fade + grow in, hold, then keep growing while fading out — reveals the
  // page underneath as the mark dissolves past its normal size.
  tl.to(logo.value, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" })
    .to({}, { duration: 0.35 })
    .to(logo.value, { opacity: 0, scale: 1.4, duration: 0.6, ease: "power2.in" })
    .to(root.value, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, "<");
});
</script>

<template>
  <div ref="root" class="fixed inset-0 z-100 grid place-items-center bg-bg">
    <img ref="logo" :src="bigLogo" alt="Logic Play" class="brand-mark h-16 w-auto sm:h-20" />
  </div>
</template>
