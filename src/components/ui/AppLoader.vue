<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { markAppReady } from "@/composables/useAppReady";

const overlay = ref<HTMLElement | null>(null);
const visible = ref(true);
const percent = ref(0);

let ctx: gsap.Context | undefined;

onMounted(() => {
  if (!overlay.value) return;
  document.body.style.overflow = "hidden";

  ctx = gsap.context(() => {
    const counter = { val: 0 };
    gsap
      .timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          markAppReady();
          document.body.style.overflow = "";
          gsap.to(overlay.value, {
            opacity: 0,
            scale: 1.04,
            duration: 0.6,
            ease: "power3.inOut",
            onComplete: () => {
              visible.value = false;
            },
          });
        },
      })
      .to(counter, {
        val: 100,
        duration: 1.3,
        onUpdate: () => {
          percent.value = Math.round(counter.val);
        },
      })
      .to({}, { duration: 0.2 });
  }, overlay.value);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <div
    v-if="visible"
    ref="overlay"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
  >
    <div class="w-64">
      <div class="flex items-baseline justify-between text-xs text-muted">
        <span>booting logic<span class="text-accent-blue">_</span>play</span>
        <span class="tabular-nums text-text">{{ percent }}%</span>
      </div>
      <div class="mt-3 h-px w-full bg-border">
        <div
          class="h-px bg-linear-to-r from-accent-blue to-accent-violet"
          :style="{ width: percent + '%' }"
        />
      </div>
    </div>
  </div>
</template>
