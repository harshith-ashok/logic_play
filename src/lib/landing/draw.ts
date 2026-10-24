// Shared helpers for the landing page's canvas art. Everything here is
// framework-free: components own their canvases and call into these.

export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Process colours; only ever used as "misregistration" when something is played. */
export const C = {
  ink: "#070708",
  paper: "#F3F3F0",
  cyan: "#00AEEF",
  magenta: "#EC008C",
  yellow: "#FFF200",
  mute: "#7E7E86",
} as const;

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () => matchMedia("(pointer: fine)").matches;
export const dpr = (max = 1.5) => Math.min(window.devicePixelRatio || 1, max);

/** Sizes the backing store to the CSS box; returns the CSS size. */
export function fitCanvas(cv: HTMLCanvasElement, maxDpr = 1.5) {
  const r = cv.getBoundingClientRect();
  const d = dpr(maxDpr);
  const w = Math.max(1, Math.round(r.width * d));
  const h = Math.max(1, Math.round(r.height * d));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  return { w: r.width, h: r.height, d };
}

export function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
}

/* ---------- logo geometry (the official mark, upright; shear K applied at draw time) ---------- */
export const K = 0.2;
export const BASE = 838;
export const L_PATH = new Path2D("M90 255H275V652H372V838H90Z");
export const P_PATH = new Path2D(
  "M383 838V310H690C772.8 310 840 377.2 840 460V540C840 622.8 772.8 690 690 690H560V838Z",
);
export const STAR = { x: 660, y: 515, a: 175, b: 160 };
export const MARK_C = { x: 503, y: 546.5 };
export const MARK_W = 826;
export const MARK_H = 583;

/* ---------- shared pointer, smoothed by the ticker ---------- */
export const ptr = {
  x: 0, y: 0, sx: 0, sy: 0, vx: 0, vy: 0,
  last: -1e9,
  has: false,
};

let started = false;
function startPointer() {
  if (started) return;
  started = true;
  ptr.x = ptr.sx = innerWidth / 2;
  ptr.y = ptr.sy = innerHeight / 2;
  addEventListener(
    "pointermove",
    (e) => {
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.last = performance.now();
      ptr.has = true;
    },
    { passive: true },
  );
}

/* ---------- one rAF loop for every canvas on the page ---------- */
type Tick = (now: number, t: number) => void;
const subs = new Set<Tick>();
let raf = 0;
let prevSX = 0;
let prevSY = 0;

function loop(now: number) {
  // Idle pointer drift is owned by the hero (it knows where the star is);
  // here we only smooth the real pointer and derive its velocity.
  prevSX = ptr.sx;
  prevSY = ptr.sy;
  for (const fn of subs) fn(now, now / 1000);
  ptr.vx = lerp(ptr.vx, ptr.sx - prevSX, 0.3);
  ptr.vy = lerp(ptr.vy, ptr.sy - prevSY, 0.3);
  raf = subs.size ? requestAnimationFrame(loop) : 0;
}

export function subscribe(fn: Tick) {
  startPointer();
  subs.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    subs.delete(fn);
  };
}

/* ---------- halftone band between slabs ---------- */
export function drawBand(cv: HTMLCanvasElement, from: string, to: string) {
  const { w, h } = fitCanvas(cv);
  const ctx = cv.getContext("2d")!;
  const d = dpr();
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = from;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = to;
  const sp = 14;
  const rows = Math.ceil(h / sp) + 1;
  ctx.beginPath();
  for (let r = 0; r <= rows; r++) {
    const y = r * sp;
    const k = clamp(y / h);
    const e = k * k * (3 - 2 * k);
    const rad = sp * 0.76 * e;
    if (rad < 0.35) continue;
    for (let x = (r & 1 ? sp / 2 : 0) - sp; x < w + sp; x += sp) {
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
  }
  ctx.fill();
  ctx.fillRect(0, h - 2, w, 2);
}

/* ---------- scalar fields for the "loop" step cards ---------- */
const TREE: number[][] = [];
(function build(x: number, y: number, ang: number, len: number, depth: number) {
  const x2 = x + Math.sin(ang) * len;
  const y2 = y - Math.cos(ang) * len;
  TREE.push([x, y, x2, y2, depth]);
  if (depth < 4) {
    build(x2, y2, ang - 0.52, len * 0.7, depth + 1);
    build(x2, y2, ang + 0.52, len * 0.7, depth + 1);
  }
})(0, 0.95, 0, 0.46, 0);

function segDist(px: number, py: number, s: number[]) {
  const dx = s[2] - s[0];
  const dy = s[3] - s[1];
  const k = clamp(((px - s[0]) * dx + (py - s[1]) * dy) / (dx * dx + dy * dy));
  return Math.hypot(s[0] + dx * k - px, s[1] + dy * k - py);
}

export type FieldName = "rings" | "waves" | "tree" | "star";
export const FIELDS: Record<FieldName, (nx: number, ny: number, t: number) => number> = {
  rings(nx, ny, t) {
    const d = Math.hypot(nx * 0.8, ny);
    if (d < 0.17) return 1.2;
    return (1 - smooth(0.62, 0.98, d)) * Math.pow(0.5 + 0.5 * Math.sin(d * 24 - t * 2.4), 1.4);
  },
  waves(nx, ny, t) {
    const d1 = Math.hypot(nx + 0.5, ny);
    const d2 = Math.hypot(nx - 0.5, ny);
    const v = (Math.sin(d1 * 19 - t * 2.3) + Math.sin(d2 * 19 - t * 2.3)) * 0.25 + 0.5;
    return v * v * 1.15 * (1 - smooth(0.75, 1.15, Math.hypot(nx * 0.62, ny)));
  },
  tree(nx, ny, t) {
    let f = 0;
    for (const s of TREE) {
      const w = 0.075 - s[4] * 0.011;
      const g = 1 - segDist(nx * 0.9, ny, s) / w;
      if (g > f) f = g;
    }
    if (f <= 0) return 0;
    const pulse = 0.5 + 0.5 * Math.sin(ny * 7 + t * 3.2);
    return f * (0.55 + 0.6 * pulse);
  },
  star(nx, ny, t) {
    const k = 1 + 0.07 * Math.sin(t * 2.1);
    const u = Math.abs(nx) / (1.05 * k);
    const v = Math.abs(ny) / (0.92 * k);
    const d = Math.sqrt(u) + Math.sqrt(v);
    return d < 1
      ? 1.28 * Math.pow(1 - d, 0.5)
      : d < 1.2
        ? (0.5 + 0.5 * Math.sin(t * 4 + nx * 9 + ny * 7)) * (1.2 - d) * 0.9
        : 0;
  },
};

export function drawField(cv: HTMLCanvasElement, field: FieldName, t: number) {
  const { w, h } = fitCanvas(cv);
  const ctx = cv.getContext("2d")!;
  const d = dpr();
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const sp = 11;
  const half = Math.min(w, h) / 2;
  const fn = FIELDS[field];
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  for (let y = sp / 2; y < h; y += sp) {
    for (let x = sp / 2; x < w; x += sp) {
      const f = fn((x - w / 2) / half, (y - h / 2) / half, t);
      if (f < 0.06) continue;
      const r = Math.min(f, 1.2) * sp * 0.5;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  }
  ctx.fill();
}
