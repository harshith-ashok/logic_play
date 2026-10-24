<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { vSettle } from "../../lib/landing/settle";
import {
  C, TAU, clamp, dpr, finePointer, fitCanvas, lerp, prefersReducedMotion, starPath, subscribe,
} from "../../lib/landing/draw";
import { perks } from "../../data/perks";

// One cloud of points morphs between a shape per thing the club does.
const ORDER = ["cube", "sphere", "spark", "torus", "helix"] as const;
type Shape = (typeof ORDER)[number];
const items = perks.slice(0, ORDER.length).map((p, i) => ({ ...p, shape: ORDER[i] }));

const N = 1100;
const reduce = prefersReducedMotion();
const fine = finePointer();

const SHAPES = (() => {
  const mk = () => new Float32Array(N * 3);
  const out: Record<Shape, Float32Array> = { cube: mk(), sphere: mk(), spark: mk(), torus: mk(), helix: mk() };
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    out.sphere.set([x * 0.95, y * 0.95, z * 0.95], i * 3);
    const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
    const m = Math.max(ax, ay, az);
    const tt = Math.pow(clamp((m - 0.577) / 0.423), 3.4);
    const rad = az === m ? 0.24 + 0.42 * tt : 0.24 + 1.12 * tt;
    out.spark.set([x * rad, y * rad, z * rad], i * 3);
    const face = i % 6;
    const k = Math.floor(i / 6);
    const n = 14;
    const cell = Math.floor((k * (n * n)) / Math.ceil(N / 6));
    const u = ((cell % n) / (n - 1)) * 2 - 1;
    const v = (Math.floor(cell / n) / (n - 1)) * 2 - 1;
    const q = 0.68;
    const F = [[1, u, v], [-1, u, v], [u, 1, v], [u, -1, v], [u, v, 1], [u, v, -1]][face];
    out.cube.set([F[0] * q, F[1] * q, F[2] * q], i * 3);
    const tu = (TAU * (i % 50)) / 50;
    const tv = (TAU * Math.floor(i / 50)) / 22;
    const R = 0.74, rr = 0.3;
    out.torus.set([(R + rr * Math.cos(tv)) * Math.cos(tu), rr * Math.sin(tv), (R + rr * Math.cos(tv)) * Math.sin(tu)], i * 3);
    // double helix
    const s = i % 2;
    const hp = (i / N) * 3.4 * TAU;
    const hy = (i / N) * 2 - 1;
    out.helix.set([Math.cos(hp + s * Math.PI) * 0.5, hy * 0.95, Math.sin(hp + s * Math.PI) * 0.5], i * 3);
  }
  return out;
})();

const cur = new Float32Array(N * 3);
const tgt = new Float32Array(N * 3);
const spd = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const a = Math.random() * TAU;
  const b = Math.acos(2 * Math.random() - 1);
  const r = 1.5 + Math.random() * 0.9;
  cur[i * 3] = Math.sin(b) * Math.cos(a) * r;
  cur[i * 3 + 1] = Math.cos(b) * r;
  cur[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
  spd[i] = 0.035 + 0.055 * ((i * 0.6180339) % 1);
}

const cv = ref<HTMLCanvasElement | null>(null);
const active = ref<Shape>("cube");
const label = () => active.value[0].toUpperCase() + active.value.slice(1);

const eng = { w: 0, h: 0, rx: -0.42, ry: 0.6, vrx: 0, vry: 0.005, drag: null as null | { x: number; y: number }, mx: -1e4, my: -1e4, lastUser: -1e9, lastSwitch: 0, idx: 0 };
let visible = false;

function setShape(name: Shape, user = false) {
  eng.idx = ORDER.indexOf(name);
  active.value = name;
  tgt.set(SHAPES[name]);
  eng.lastSwitch = performance.now();
  if (user) eng.lastUser = performance.now();
}

function onDown(e: PointerEvent) {
  eng.drag = { x: e.clientX, y: e.clientY };
  cv.value!.setPointerCapture(e.pointerId);
  eng.lastUser = performance.now();
}
function onMove(e: PointerEvent) {
  const r = cv.value!.getBoundingClientRect();
  eng.mx = e.clientX - r.left;
  eng.my = e.clientY - r.top;
  if (eng.drag) {
    eng.vry = (e.clientX - eng.drag.x) * 0.006;
    eng.vrx = (e.clientY - eng.drag.y) * 0.006;
    eng.drag = { x: e.clientX, y: e.clientY };
  }
}
const endDrag = () => (eng.drag = null);
const onLeave = () => {
  eng.mx = eng.my = -1e4;
};

const BUCKETS = 6;
function draw(now: number) {
  const ctx = cv.value!.getContext("2d")!;
  const { w, h } = eng;
  const d = dpr();
  if (!eng.drag) {
    eng.vry = lerp(eng.vry, 0.005, 0.03);
    eng.vrx = lerp(eng.vrx, 0, 0.04);
  }
  eng.ry += eng.vry;
  eng.rx = clamp(eng.rx + eng.vrx, -1.25, 1.25);
  if (!reduce && now - eng.lastUser > 7000 && now - eng.lastSwitch > 4600) setShape(ORDER[(eng.idx + 1) % ORDER.length]);
  for (let i = 0; i < N * 3; i++) cur[i] += (tgt[i] - cur[i]) * spd[(i / 3) | 0];
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 - 10, R = Math.min(w, h) * 0.33, F = 3.4;
  const cY = Math.cos(eng.ry), sY = Math.sin(eng.ry), cX = Math.cos(eng.rx), sX = Math.sin(eng.rx);
  ctx.strokeStyle = "rgba(243,243,240,.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * 1.42, R * (0.12 + 0.5 * Math.abs(sX)), 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.42, 0, TAU);
  ctx.setLineDash([2, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  const paths = Array.from({ length: BUCKETS }, () => new Path2D());
  const accents: [number, number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const x = cur[i * 3], y = cur[i * 3 + 1], z = cur[i * 3 + 2];
    const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
    const y1 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
    if (F + z2 < 0.6) continue;
    const ps = F / (F + z2);
    let sx = cx + x1 * R * ps, sy = cy + y1 * R * ps;
    const dx = sx - eng.mx, dy = sy - eng.my, dd = Math.hypot(dx, dy);
    if (dd < 80 && dd > 0.01) {
      const push = (80 - dd) * 0.55;
      sx += (dx / dd) * push;
      sy += (dy / dd) * push;
    }
    const depth = clamp((z2 + 1.4) / 2.8);
    const b = Math.min(BUCKETS - 1, (depth * BUCKETS) | 0);
    const r = Math.max(0.4, (2.4 - depth * 1.7) * Math.min(ps, 2) * 0.9);
    if (i % 53 === 0) accents.push([sx, sy, r * 1.25, i]);
    else {
      paths[b].moveTo(sx + r, sy);
      paths[b].arc(sx, sy, r, 0, TAU);
    }
  }
  for (let b = BUCKETS - 1; b >= 0; b--) {
    ctx.fillStyle = C.paper;
    ctx.globalAlpha = 0.18 + 0.82 * (1 - b / (BUCKETS - 1));
    ctx.fill(paths[b]);
  }
  ctx.globalAlpha = 1;
  const acc = [C.cyan, C.magenta, C.yellow];
  for (const [x, y, r, i] of accents) {
    ctx.fillStyle = acc[i % 3];
    ctx.beginPath();
    starPath(ctx, x, y, r * 2.4);
    ctx.fill();
  }
}

let unsub: (() => void) | null = null;
let io: IntersectionObserver | null = null;
let rz = 0;
const resize = () => {
  const r = fitCanvas(cv.value!);
  eng.w = r.w;
  eng.h = r.h;
};
const onResize = () => {
  clearTimeout(rz);
  rz = window.setTimeout(resize, 120);
};

onMounted(() => {
  resize();
  setShape("cube");
  addEventListener("resize", onResize);
  io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { rootMargin: "120px 0px" });
  io.observe(cv.value!);
  unsub = subscribe((now) => visible && draw(now));
});
onBeforeUnmount(() => {
  unsub?.();
  io?.disconnect();
  removeEventListener("resize", onResize);
  clearTimeout(rz);
});
</script>

<template>
  <section id="engine" class="engine ink">
    <div class="lp-wrap engine-grid">
      <div class="engine-stage" data-cursor="drag">
        <canvas
          id="engineCanvas" ref="cv" aria-label="Rotating 3D point cloud that changes shape for each thing we do"
          @pointerdown="onDown" @pointermove="onMove" @pointerup="endDrag" @pointercancel="endDrag" @pointerleave="onLeave"
        />
        <span class="reg tl"><i /></span><span class="reg tr"><i /></span>
        <span class="reg bl"><i /></span><span class="reg br"><i /></span>
        <div class="engine-hud mono"><span>Form <b>{{ label() }}</b></span><span>1,100 nodes / drag to spin</span></div>
      </div>
      <div class="engine-copy">
        <p class="eyebrow">What we do</p>
        <h2 v-settle class="display settle">One club. Five ways to build.</h2>
        <ul class="offers">
          <li v-for="it in items" :key="it.title">
            <button
              class="offer" :class="active === it.shape && 'active'" type="button"
              @click="setShape(it.shape, true)" @pointerenter="fine && setShape(it.shape, true)"
            >
              <span class="offer-title"><span class="spark" />{{ it.title }}</span>
              <span class="offer-shape">{{ it.shape }}</span>
              <span class="offer-desc"><span>{{ it.description }}</span></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
