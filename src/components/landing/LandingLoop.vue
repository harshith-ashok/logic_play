<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { vSettle } from "../../lib/landing/settle";
import { clamp, drawField, lerp, prefersReducedMotion, subscribe, type FieldName } from "../../lib/landing/draw";

const steps: { n: string; title: string; text: string; field: FieldName }[] = [
  { n: "01", title: "Learn", text: "Workshops, expert sessions, coding bootcamps and certification programs build the base.", field: "rings" },
  { n: "02", title: "Build", text: "Real-world AI, ML and software projects, taken from idea to something people can use.", field: "waves" },
  { n: "03", title: "Compete", text: "Hackathons and innovation challenges, nationally and internationally. Form a team, ship under pressure.", field: "tree" },
  { n: "04", title: "Publish", text: "Journal papers, conference papers, patents and copyrights. A track record, not just a resume line.", field: "star" },
];

const reduce = prefersReducedMotion();
const loop = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
const bar = ref<HTMLElement | null>(null);
const canvases = ref<HTMLCanvasElement[]>([]);

const flat = ref(false);
let dist = 0;
let offsets: number[] = [];
let widths: number[] = [];
let ps = 0;
let visible = false;
let frame = 0;

function resize() {
  if (!loop.value || !track.value) return;
  if (reduce || innerWidth <= 900) {
    // Small screens and reduced motion: a normal swipeable row instead of a pinned scroll.
    loop.value.style.height = "";
    track.value.style.transform = "";
    dist = 0;
    flat.value = true;
    return;
  }
  flat.value = false;
  dist = Math.max(0, track.value.scrollWidth - innerWidth);
  offsets = canvases.value.map((c) => c.offsetParent ? (c.parentElement as HTMLElement).offsetLeft : 0);
  widths = canvases.value.map((c) => c.offsetWidth);
  loop.value.style.height = `${innerHeight - 64 + dist * 1.1}px`;
}

let unsub: (() => void) | null = null;
let io: IntersectionObserver | null = null;
let rz = 0;
const onResize = () => {
  clearTimeout(rz);
  rz = window.setTimeout(resize, 120);
};

onMounted(async () => {
  await nextTick();
  resize();
  addEventListener("resize", onResize);
  io = new IntersectionObserver((es) => (visible = es[0].isIntersecting), { rootMargin: "120px 0px" });
  io.observe(loop.value!);
  if (reduce) canvases.value.forEach((c, i) => drawField(c, steps[i].field, 0));

  unsub = subscribe((_now, t) => {
    if (!visible) return;
    if (dist > 0) {
      const r = loop.value!.getBoundingClientRect();
      const p = clamp(-(r.top - 64) / (r.height - (innerHeight - 64)));
      ps = lerp(ps, p, 0.1);
      track.value!.style.transform = `translate3d(${-ps * dist}px,0,0)`;
      bar.value!.style.transform = `scaleX(${ps})`;
    }
    if (reduce) return;
    if (++frame % 3 === 0) {
      // Offsets are cached, so no layout reads here; only on-screen cards redraw.
      canvases.value.forEach((c, i) => {
        const left = offsets[i] - ps * dist;
        if (left + widths[i] > -50 && left < innerWidth + 50) drawField(c, steps[i].field, t);
      });
    }
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
  <section id="loop" ref="loop" class="loop ink" :class="flat && 'flat'">
    <div class="loop-sticky">
      <div class="lp-wrap loop-head" style="width: 100%">
        <div>
          <p class="eyebrow">The loop</p>
          <h2 class="display settle" v-settle>Every member runs the same four moves.</h2>
        </div>
        <p>From first workshop to first paper, this is the path through the club.</p>
      </div>
      <div ref="track" class="loop-track">
        <article v-for="(s, i) in steps" :key="s.n" class="step">
          <div class="step-top"><span class="step-num">{{ s.n }}</span><span class="mono">Move {{ i + 1 }} of 4</span></div>
          <canvas :ref="(el) => el && (canvases[i] = el as HTMLCanvasElement)" aria-hidden="true" />
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </article>
        <div class="step-end">
          <span class="mono">Then</span>
          <p>Then the next project starts the loop again, one level harder.</p>
          <a class="btn" href="#join"><span>Start the loop <span class="spark" /></span></a>
        </div>
      </div>
      <div class="loop-progress" aria-hidden="true"><span ref="bar" /></div>
    </div>
  </section>
</template>
