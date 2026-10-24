<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  BASE, C, K, L_PATH, MARK_C, MARK_H, MARK_W, P_PATH, STAR, TAU,
  clamp, easeOutExpo, fitCanvas, lerp, prefersReducedMotion, ptr, smooth, subscribe,
} from "../../lib/landing/draw";

defineProps<{ announcement?: { text: string; link: string | null } | null; joinLink?: string }>();

const hero = ref<HTMLElement | null>(null);
const cv = ref<HTMLCanvasElement | null>(null);
const words = ref<HTMLElement | null>(null);
const hud = ref<HTMLElement | null>(null);
const xy = ref<HTMLElement | null>(null);
const depth = ref<HTMLElement | null>(null);
const ready = ref(false);

const reduce = prefersReducedMotion();
let W = 0;
let H = 0;
let D = 1;
// Canvas box, read once per frame (layout reads are the expensive part).
let R = new DOMRect();
let ps = 0;
let introT0: number | null = null;
let hv = 0;
let kick = 0;
let visible = false;
let hudTick = 0;
let frame = 0;
const rest = { x: 0, y: 0, s: 1, fx: 0, fy: 0, S: 1, offP: 0 };
const ripples: { x: number; y: number; t: number }[] = [];
const SX = new Float32Array(2000);
const SY = new Float32Array(2000);
const SR = new Float32Array(2000);
const mis = { x: 0, y: 0 };

function resize() {
  if (!cv.value) return;
  const r = fitCanvas(cv.value, 1.25);
  W = r.w;
  H = r.h;
  D = r.d;
}

function onPointerDown(e: PointerEvent) {
  const gx = (e.clientX - R.left - rest.fx) / rest.S - rest.offP;
  const gy = (e.clientY - R.top - rest.fy) / rest.S;
  ripples.push({ x: gx, y: gy, t: performance.now() / 1000 });
  kick = 16;
}

// Ambient dot field that the cursor lights up.
function drawField(ctx: CanvasRenderingContext2D, t: number, p: number, fx: number, fy: number, z: number) {
  const fade = 1 - smooth(0.22, 0.62, p);
  if (fade <= 0) return;
  const sp = 22;
  const zf = 1 + (z - 1) * 0.16;
  const sq = Math.sqrt(zf);
  const mx = ptr.sx;
  const my = ptr.sy - R.top;
  const left = R.left;
  ctx.fillStyle = C.paper;
  ctx.globalAlpha = 0.2 * fade;
  ctx.beginPath();
  const cols = Math.ceil(W / sp) + 2;
  const rows = Math.ceil(H / sp) + 2;
  for (let r = 0; r < rows; r++) {
    const by = r * sp;
    const off = r & 1 ? sp / 2 : 0;
    for (let c = -1; c < cols; c++) {
      const bx = c * sp + off;
      const x = fx + (bx - fx) * zf;
      const y = fy + (by - fy) * zf;
      if (x < -8 || x > W + 8 || y < -8 || y > H + 8) continue;
      const dx = x - (mx - left);
      const dy = y - my;
      const g = Math.exp(-(dx * dx + dy * dy) / 62000);
      const w = 0.5 + 0.5 * Math.sin(bx * 0.0105 + t * 0.7 + Math.sin(by * 0.009 - t * 0.45) * 2.3);
      const rad = (0.3 + w * 1.15 + g * 4.2) * sq;
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// The logo's star as a halftone screen printed in three misregistered inks.
function drawStar(ctx: CanvasRenderingContext2D, t: number, p: number, S: number, fx: number, fy: number, offP: number, appear: number) {
  const shrink = 1 - smooth(0.1, 0.66, p);
  if (shrink <= 0.002) return;
  const br = reduce ? 1 : 1 + 0.03 * Math.sin(t * 1.7);
  const a = STAR.a * br;
  const b = STAR.b * br;
  const sp = 13;
  const spread = 1 + 2.6 * p * p;
  const mgx = (ptr.sx - R.left - fx) / S - offP;
  const mgy = (ptr.sy - R.top - fy) / S;
  const over = Math.abs(mgx) < a * 1.35 && Math.abs(mgy) < b * 1.35 ? 1 : 0;
  hv = lerp(hv, over, 0.08);
  for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t > 1.5) ripples.splice(i, 1);
  let n = 0;
  const J = Math.ceil((b + sp * 3) / sp);
  const I = Math.ceil((a + sp * 3) / sp);
  for (let j = -J; j <= J; j++) {
    const gy = j * sp;
    for (let i = -I; i <= I; i++) {
      const gx = i * sp;
      const u = Math.abs(gx) / a;
      const v = Math.abs(gy) / b;
      const d = Math.sqrt(u) + Math.sqrt(v);
      let f = d < 1 ? 1.28 * Math.pow(1 - d, 0.55) : d < 1.22 ? (1.22 - d) * 0.5 : 0;
      if (d < 1.8) {
        if (hv > 0.01) {
          const dx = gx - mgx;
          const dy = gy - mgy;
          f += hv * 0.95 * Math.exp(-(dx * dx + dy * dy) / 3000);
        }
        for (const rp of ripples) {
          const age = t - rp.t;
          const R = age * 280;
          const dd = Math.hypot(gx - rp.x, gy - rp.y) - R;
          f += (1 - age / 1.5) * 0.9 * Math.exp(-(dd * dd) / 500);
        }
      }
      if (f < 0.05 || n >= 2000) continue;
      SX[n] = STAR.x + gx * spread;
      SY[n] = STAR.y + gy * spread;
      SR[n] = Math.min(f, 1.35) * sp * 0.5 * shrink;
      n++;
    }
  }
  const vS = 0.9 / S;
  const tx = clamp(ptr.vx * vS, -10, 10) + kick * 0.6 + (1 - appear) * 40 + p * 22;
  const ty = clamp(ptr.vy * vS, -10, 10) + (1 - appear) * 12 - p * 10;
  mis.x = lerp(mis.x, tx, 0.2);
  mis.y = lerp(mis.y, ty, 0.2);
  const passes: [string, number, number][] = [
    [C.cyan, mis.x, mis.y],
    [C.magenta, -mis.x, -mis.y * 0.4],
    [C.yellow, -mis.y * 0.8, mis.x * 0.7],
  ];
  ctx.globalCompositeOperation = "multiply";
  for (const [col, ox, oy] of passes) {
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const x = SX[k] + ox;
      const y = SY[k] + oy;
      const r = SR[k];
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function draw(t: number) {
  const ctx = cv.value!.getContext("2d")!;
  const d = D;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const intro = introT0 === null ? 0 : clamp((t - introT0) / 1.5);
  const eL = easeOutExpo(clamp(intro * 1.2));
  const eP = easeOutExpo(clamp(intro * 1.2 - 0.14));
  const s = Math.min((W * 0.5) / MARK_W, (H * 0.52) / MARK_H);
  const z = 1 + 48 * Math.pow(ps, 2.1);
  const S = s * z;
  const px = ptr.sx - R.left;
  const py = ptr.sy - R.top;
  const parX = (px / W - 0.5) * -26 * (1 - ps);
  const parY = (py / H - 0.5) * -18 * (1 - ps);
  const restX = W / 2 + (STAR.x - MARK_C.x) * s + parX;
  const restY = H * 0.5 + (STAR.y - MARK_C.y) * s + parY;
  const e = smooth(0, 0.55, ps);
  const fx = lerp(restX, W / 2, e);
  const fy = lerp(restY, H / 2, e);
  const offL = -(1 - eL) * 340;
  const offP = (1 - eP) * 340;
  Object.assign(rest, { x: restX, y: restY, s, fx, fy, S, offP });

  drawField(ctx, t, ps, fx, fy, z);

  const world = (ox: number) =>
    ctx.setTransform(d * S, 0, 0, d * S, d * (fx + (ox - STAR.x) * S), d * (fy - STAR.y * S));
  ctx.fillStyle = C.paper;
  ctx.globalAlpha = eL;
  world(offL);
  ctx.transform(1, 0, -K, 1, K * BASE, 0);
  ctx.fill(L_PATH);
  ctx.globalAlpha = eP;
  world(offP);
  ctx.transform(1, 0, -K, 1, K * BASE, 0);
  ctx.fill(P_PATH);
  ctx.save();
  ctx.clip(P_PATH);
  world(offP);
  drawStar(ctx, t, ps, S, fx, fy, offP, eP);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function updateDom() {
  if (!hud.value || !words.value) return;
  hud.value.style.opacity = String(1 - smooth(0, 0.22, ps));
  const mxn = ptr.sx / innerWidth - 0.5;
  const myn = ptr.sy / innerHeight - 0.5;
  words.value.style.opacity = String(1 - smooth(0.02, 0.3, ps));
  // Translate only: scaling this outlined display text would re-rasterise it every frame.
  words.value.style.transform = `translate3d(${mxn * 34}px, ${myn * 22 - ps * 120}px, 0)`;
  if (++hudTick % 4 === 0 && xy.value && depth.value) {
    xy.value.textContent = `X ${(ptr.sx / innerWidth).toFixed(3)}  Y ${(ptr.sy / innerHeight).toFixed(3)}`;
    depth.value.textContent = `Depth ${String(Math.round(ps * 100)).padStart(3, "0")}%`;
  }
}

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
  io.observe(hero.value!);

  // Letters rise once the page loader has wiped away (or straight away on later visits).
  let seen = false;
  try {
    seen = sessionStorage.getItem("lp-loaded") === "1";
  } catch {
    /* ignore */
  }
  const begin = () => {
    if (ready.value) return;
    ready.value = true;
    introT0 = performance.now() / 1000;
  };
  if (reduce || seen) window.setTimeout(begin, 150);
  else {
    window.addEventListener("lp:loaded", () => window.setTimeout(begin, 380), { once: true });
    window.setTimeout(begin, 5000);
  }

  unsub = subscribe((now, t) => {
    // Idle: the spark wanders on its own until the pointer moves.
    const idle = !ptr.has || now - ptr.last > 2600;
    R = cv.value!.getBoundingClientRect();
    const rect = R;
    const ax = rect.left + rest.x + Math.cos(t * 0.6) * STAR.a * rest.s * 0.75;
    const ay = rect.top + rest.y + Math.sin(t * 0.95) * STAR.b * rest.s * 0.6;
    const tx = idle && visible ? ax : ptr.x;
    const ty = idle && visible ? ay : ptr.y;
    ptr.sx = lerp(ptr.sx, tx, idle ? 0.05 : 0.2);
    ptr.sy = lerp(ptr.sy, ty, idle ? 0.05 : 0.2);
    kick *= 0.9;
    if (!visible) return;
    const r = hero.value!.getBoundingClientRect();
    const span = r.height - (innerHeight - 64);
    const target = reduce || span <= 0 ? 0 : clamp(-(r.top - 64) / span);
    ps = lerp(ps, target, 0.12);
    // Parked at the top with no pointer or clicks: the star only breathes,
    // so redraw at half rate.
    const calm = Math.abs(target - ps) < 0.0005 && !ripples.length && kick < 0.5 && idle;
    if (calm && (frame++ & 1)) return;
    draw(t);
    updateDom();
  });
});

onBeforeUnmount(() => {
  unsub?.();
  io?.disconnect();
  removeEventListener("resize", onResize);
  clearTimeout(rz);
});
</script>

<template>
  <section id="top" ref="hero" class="hero" :class="ready && 'intro-ready'" aria-label="Logic Play">
    <div class="hero-stage">
      <div ref="words" class="hero-words" aria-hidden="true">
        <span class="hw hw-1 split" style="--d: 250ms">
          <span v-for="(ch, i) in 'LOGIC'" :key="i" class="ch" :style="{ '--i': i }">{{ ch }}</span>
        </span>
        <span class="hw hw-2 split" style="--d: 520ms">
          <span v-for="(ch, i) in 'PLAY'" :key="i" class="ch" :style="{ '--i': i }">{{ ch }}</span>
        </span>
      </div>
      <canvas id="heroCanvas" ref="cv" data-cursor="click" @pointerdown="onPointerDown" />
      <div ref="hud" class="hero-hud">
        <h1 class="sr-only">Logic Play: stop consuming technology, start building it</h1>
        <div class="hud-tl fade">
          <span class="mono">Logic Play</span>
          <span class="mono">Builder's club / SRM</span>
          <component
            :is="announcement?.link ? 'a' : 'span'"
            v-if="announcement"
            :href="announcement.link ?? undefined"
            class="mono hero-news"
          >
            <i />{{ announcement.text }}<span v-if="announcement.link" aria-hidden="true">&rarr;</span>
          </component>
          <span v-else class="mono">Level 01 / The spark</span>
        </div>
        <div class="hud-tr fade">
          <span class="mono">Cursor</span>
          <span ref="xy" class="mono">X 0.500  Y 0.500</span>
          <span ref="depth" class="mono">Depth 000%</span>
        </div>
        <div class="hero-bottom fade">
          <div>
            <p class="hero-tag">
              Stop consuming technology. Start building it. <em>Real projects, real hackathons, real mentors.</em>
            </p>
            <div class="hero-cta">
              <a v-if="joinLink && /^https?:/.test(joinLink)" class="btn" :href="joinLink" target="_blank" rel="noopener noreferrer"><span>Join the club <span class="spark" /></span></a>
              <router-link v-else class="btn" :to="joinLink || '/join'"><span>Join the club <span class="spark" /></span></router-link>
              <a class="btn btn--ghost" href="#engine"><span>See what we do</span></a>
            </div>
          </div>
          <div class="hero-scroll mono"><span>Scroll to enter the spark</span><i /></div>
        </div>
      </div>
    </div>
  </section>
</template>
