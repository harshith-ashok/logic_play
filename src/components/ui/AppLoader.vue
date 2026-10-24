<script setup lang="ts">
import { onMounted, ref } from "vue";
import { C, TAU, clamp, fitCanvas, smooth } from "../../lib/landing/draw";

const emit = defineEmits<{ done: [] }>();
const cv = ref<HTMLCanvasElement | null>(null);
const count = ref("000");
const wiping = ref(false);

// The logo's star fills in as a halftone screen while a counter runs, then the
// slab wipes up off the page. Never waits on window.load.
function draw(k: number) {
  const el = cv.value!;
  const { w, h, d } = fitCanvas(el);
  const ctx = el.getContext("2d")!;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const sp = w / 22;
  const a = w * 0.48;
  const b = h * 0.46;
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  for (let y = sp / 2; y < h; y += sp) {
    for (let x = sp / 2; x < w; x += sp) {
      const u = Math.abs(x - w / 2) / a;
      const v = Math.abs(y - h / 2) / b;
      const dd = Math.sqrt(u) + Math.sqrt(v);
      if (dd >= 1) continue;
      const f = 1.25 * Math.pow(1 - dd, 0.55) * smooth(dd * 0.8, dd * 0.8 + 0.25, k);
      const r = Math.min(f, 1.3) * sp * 0.5;
      if (r < 0.2) continue;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  }
  ctx.fill();
}

function finish() {
  wiping.value = true;
  try {
    sessionStorage.setItem("lp-loaded", "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("lp:loaded"));
  window.setTimeout(() => emit("done"), 1000);
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }
  const t0 = performance.now();
  const dur = 1500;
  let fontsReady = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => (fontsReady = true));
  const frame = (now: number) => {
    const k = clamp((now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    draw(e);
    count.value = String(Math.round(e * 100)).padStart(3, "0");
    if (k < 1 || (!fontsReady && now - t0 < 3000)) requestAnimationFrame(frame);
    else finish();
  };
  requestAnimationFrame(frame);
});
</script>

<template>
  <div class="loader ink" :class="wiping && 'done'" aria-hidden="true">
    <canvas ref="cv" />
    <div class="loader-meta">
      <span class="mono">Logic Play / loading the spark</span>
      <span class="loader-count">{{ count }}</span>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s var(--ease-io);
}
.loader.done {
  clip-path: inset(0 0 100% 0);
}
.loader canvas {
  width: min(34vmin, 300px);
  height: min(34vmin, 300px);
  transition: transform 1s var(--ease-io), opacity 0.8s;
}
.loader.done canvas {
  transform: translateY(-14vh) scale(0.6);
  opacity: 0;
}
.loader-meta {
  position: absolute;
  left: clamp(16px, 4vw, 64px);
  right: clamp(16px, 4vw, 64px);
  bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.loader-count {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 900;
  font-stretch: 125%;
  font-size: clamp(56px, 8vw, 120px);
  line-height: 0.8;
  font-variant-numeric: tabular-nums;
}
</style>
