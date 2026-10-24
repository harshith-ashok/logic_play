<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

// Dot + trailing ring + optional label, blended with `difference`. The ring
// swells over links/buttons; anything with data-cursor="word" shows that word.
// Fine pointers only, one set of delegated listeners, and the follow loop
// parks itself once the ring has caught up. `.magnetic` elements lean toward
// the pointer (via the `translate` property so they keep their own transform).
const root = ref<HTMLElement | null>(null);
const dot = ref<HTMLElement | null>(null);
const ring = ref<HTMLElement | null>(null);
const label = ref<HTMLElement | null>(null);

const HOVER = "a, button, [role='button'], summary, label";
const TEXTY = "input, textarea, select";

let mx = 0;
let my = 0;
let rx = 0;
let ry = 0;
let raf = 0;
let magnet: HTMLElement | null = null;

function loop() {
  rx += (mx - rx) * 0.16;
  ry += (my - ry) * 0.16;
  const t = `translate3d(${rx}px, ${ry}px, 0)`;
  if (ring.value) ring.value.style.transform = t;
  if (label.value) label.value.style.transform = t;
  raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  const el = root.value;
  if (!el) return;
  if (!document.documentElement.classList.contains("has-cursor")) {
    document.documentElement.classList.add("has-cursor");
    rx = e.clientX;
    ry = e.clientY;
  }
  mx = e.clientX;
  my = e.clientY;
  if (dot.value) dot.value.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  if (!raf) raf = requestAnimationFrame(loop);

  const target = e.target as HTMLElement | null;
  // Over text fields the native I-beam is more useful than our cursor.
  const texty = !!target?.closest(TEXTY);
  el.style.opacity = texty ? "0" : "1";
  const labelled = target?.closest<HTMLElement>("[data-cursor]") ?? null;
  const interactive = !!target?.closest(HOVER);
  el.classList.toggle("is-hover", interactive);
  el.classList.toggle("is-label", !!labelled);
  if (labelled && label.value && label.value.dataset.text !== labelled.dataset.cursor) {
    label.value.dataset.text = labelled.dataset.cursor;
    label.value.textContent = labelled.dataset.cursor ?? "";
  }

  const m = target?.closest<HTMLElement>(".magnetic") ?? null;
  if (m !== magnet) {
    if (magnet) magnet.style.translate = "";
    magnet = m;
  }
  if (m) {
    const r = m.getBoundingClientRect();
    m.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
  }
}

function onLeave() {
  document.documentElement.classList.remove("has-cursor");
  if (magnet) magnet.style.translate = "";
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
  document.documentElement.classList.remove("has-cursor");
  cancelAnimationFrame(raf);
});
</script>

<template>
  <div ref="root" class="cursor" aria-hidden="true">
    <span ref="ring" class="cursor-ring" />
    <span ref="dot" class="cursor-dot" />
    <span ref="label" class="cursor-label" />
  </div>
</template>
