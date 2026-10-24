<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  BASE, C, K, L_PATH, MARK_C, MARK_H, MARK_W, P_PATH, STAR, clamp, fitCanvas, subscribe, TAU,
} from "../../lib/landing/draw";

// The logo as a halftone screen whose dots swell with a slow wave and with the cursor.
const box = ref<HTMLElement | null>(null);
const cv = ref<HTMLCanvasElement | null>(null);

let w = 0;
let h = 0;
let d = 1;
let sp = 10;
let pts = new Float32Array(0);
let mx = -1e4;
let my = -1e4;
let visible = false;

function resize() {
  if (!cv.value) return;
  const r = fitCanvas(cv.value);
  w = r.w;
  h = r.h;
  d = r.d;
  const s = Math.min((w * 0.96) / MARK_W, (h * 0.96) / MARK_H);
  const ox = w / 2 - MARK_C.x * s;
  const oy = h / 2 - MARK_C.y * s;
  const test = document.createElement("canvas").getContext("2d")!;
  test.setTransform(s, 0, 0, s, ox, oy);
  test.transform(1, 0, -K, 1, K * BASE, 0);
  sp = Math.max(9, Math.round(w / 110));
  const out: number[] = [];
  for (let y = sp / 2; y < h; y += sp) {
    for (let x = sp / 2; x < w; x += sp) {
      const inL = test.isPointInPath(L_PATH, x, y);
      const inP = !inL && test.isPointInPath(P_PATH, x, y);
      if (!inL && !inP) continue;
      let base = 1;
      if (inP) {
        const wx = (x - ox) / s;
        const wy = (y - oy) / s;
        const dd = Math.sqrt(Math.abs(wx - STAR.x) / STAR.a) + Math.sqrt(Math.abs(wy - STAR.y) / STAR.b);
        if (dd < 1.15) base = Math.pow(clamp((dd - 0.25) / 0.9), 1.3);
      }
      out.push(x, y, base);
    }
  }
  pts = Float32Array.from(out);
}

function draw(t: number) {
  const ctx = cv.value!.getContext("2d")!;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 3) {
    const x = pts[i];
    const y = pts[i + 1];
    const base = pts[i + 2];
    const wave = 0.5 + 0.5 * Math.sin((x * 0.8 + y) * 0.011 - t * 1.6);
    const dx = x - mx;
    const dy = y - my;
    const g = Math.exp(-(dx * dx + dy * dy) / 9000);
    const rr = Math.min(sp * 0.66, sp * 0.5 * base * (0.45 + 0.55 * wave) + g * sp * 0.32);
    if (rr < 0.25) continue;
    ctx.moveTo(x + rr, y);
    ctx.arc(x, y, rr, 0, TAU);
  }
  ctx.fill();
}

function onMove(e: PointerEvent) {
  const r = cv.value!.getBoundingClientRect();
  mx = e.clientX - r.left;
  my = e.clientY - r.top;
}
const onLeave = () => (mx = my = -1e4);

let unsub: (() => void) | null = null;
let io: IntersectionObserver | null = null;
let rz = 0;
const onResize = () => {
  clearTimeout(rz);
  rz = window.setTimeout(resize, 120);
};

onMounted(() => {
  resize();
  addEventListener("resize", onResize);
  io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { rootMargin: "120px 0px" });
  io.observe(box.value!);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) draw(0);
  let f = 0;
  unsub = subscribe((_n, t) => visible && !reduce && (f++ & 1) === 0 && draw(t));
});
onBeforeUnmount(() => {
  unsub?.();
  io?.disconnect();
  removeEventListener("resize", onResize);
  clearTimeout(rz);
});
</script>

<template>
  <div ref="box" class="foot-mark" data-cursor="hello" @pointermove="onMove" @pointerleave="onLeave">
    <canvas ref="cv" aria-hidden="true" />
  </div>
</template>

<style scoped>
.foot-mark {
  position: relative;
  width: 100%;
  height: min(60vh, calc((100vw - 120px) * 0.62));
  margin-bottom: 40px;
}
.foot-mark canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
