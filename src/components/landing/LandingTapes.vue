<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { clamp, lerp, prefersReducedMotion, subscribe } from "../../lib/landing/draw";

const words = ["Learn", "Build", "Compete", "Publish", "Repeat"];
const a = [...words, ...words, ...words, ...words];
const b = [...words].reverse();
const bb = [...b, ...b, ...b, ...b];

const wrap = ref<HTMLElement | null>(null);
const ta = ref<HTMLElement | null>(null);
const tb = ref<HTMLElement | null>(null);

let xa = 0;
let xb = 0;
let vel = 0;
let lastY = 0;
let visible = false;
let unsub: (() => void) | null = null;
let io: IntersectionObserver | null = null;

onMounted(() => {
  lastY = scrollY;
  io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { rootMargin: "120px 0px" });
  io.observe(wrap.value!);
  const reduce = prefersReducedMotion();
  unsub = subscribe(() => {
    const v = scrollY - lastY;
    lastY = scrollY;
    if (!visible || reduce) return;
    // Scroll speed shoves the tapes and skews them.
    vel = lerp(vel, v, 0.12);
    const halfA = ta.value!.scrollWidth / 2;
    const halfB = tb.value!.scrollWidth / 2;
    xa -= 1.1 + vel * 0.45;
    xb += 1.1 + vel * 0.45;
    if (xa < -halfA) xa += halfA;
    if (xa > 0) xa -= halfA;
    if (xb < -halfB) xb += halfB;
    if (xb > 0) xb -= halfB;
    const sk = clamp(-vel * 0.35, -12, 12);
    ta.value!.style.transform = `translate3d(${xa}px,0,0) skewX(${sk}deg)`;
    tb.value!.style.transform = `translate3d(${xb}px,0,0) skewX(${-sk}deg)`;
  });
});
onBeforeUnmount(() => {
  unsub?.();
  io?.disconnect();
});
</script>

<template>
  <section ref="wrap" class="tapes" aria-hidden="true">
    <div class="tape tape-a">
      <div ref="ta" class="tape-track"><template v-for="(w, i) in a" :key="i"><span>{{ w }}</span><span class="spark" /></template></div>
    </div>
    <div class="tape tape-b">
      <div ref="tb" class="tape-track"><template v-for="(w, i) in bb" :key="i"><span>{{ w }}</span><span class="spark" /></template></div>
    </div>
  </section>
</template>
