<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

// Custom cursor + ambient red glow + magnetic buttons. Fine pointers only,
// one delegated set of listeners, transform-only writes, and the ring's
// follow loop stops itself once it has caught up with the pointer.
const dot = ref<HTMLElement | null>(null);
const ring = ref<HTMLElement | null>(null);
const glow = ref<HTMLElement | null>(null);

const INTERACTIVE = "a, button, input, textarea, select, summary, [role='button']";

let mx = 0;
let my = 0;
let rx = 0;
let ry = 0;
let raf = 0;
let big = false;
let magnet: HTMLElement | null = null;

function loop() {
  rx += (mx - rx) * 0.2;
  ry += (my - ry) * 0.2;
  if (ring.value) ring.value.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.5 ? requestAnimationFrame(loop) : 0;
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  if (!document.documentElement.classList.contains("cursor-on")) {
    document.documentElement.classList.add("cursor-on");
    rx = e.clientX;
    ry = e.clientY;
  }
  mx = e.clientX;
  my = e.clientY;
  const t = `translate3d(${mx}px, ${my}px, 0)`;
  if (dot.value) dot.value.style.transform = t;
  if (glow.value) glow.value.style.transform = t;
  if (!raf) raf = requestAnimationFrame(loop);

  const target = e.target as HTMLElement | null;
  const isBig = !!target?.closest(INTERACTIVE);
  if (isBig !== big) {
    big = isBig;
    ring.value?.classList.toggle("big", big);
  }

  const m = target?.closest<HTMLElement>(".magnetic") ?? null;
  if (m !== magnet) {
    if (magnet) magnet.style.transform = "";
    magnet = m;
  }
  if (m) {
    const r = m.getBoundingClientRect();
    m.style.transform = `translate3d(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px, 0)`;
  }
}

function onLeave() {
  document.documentElement.classList.remove("cursor-on");
  if (magnet) magnet.style.transform = "";
  magnet = null;
}

onMounted(() => {
  const ok =
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!ok) return;
  document.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
});

onUnmounted(() => {
  document.removeEventListener("pointermove", onMove);
  document.documentElement.removeEventListener("pointerleave", onLeave);
  cancelAnimationFrame(raf);
});
</script>

<template>
  <div ref="glow" class="cursor-glow" aria-hidden="true" />
  <div ref="ring" class="cursor-ring" aria-hidden="true" />
  <div ref="dot" class="cursor-dot" aria-hidden="true" />
</template>
