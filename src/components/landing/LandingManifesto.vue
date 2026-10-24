<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { prefersReducedMotion, clamp } from "../../lib/landing/draw";

// *starred* words get the display treatment.
const TEXT =
  "Learning should go beyond classrooms. Logic Play is where students explore, research and *build* real AI solutions, turn ideas into papers and *patents*, and find the people who make it *click*.";

const words = TEXT.split(/\s+/).map((w) => ({ text: w.replace(/\*/g, ""), key: w.includes("*") }));
const lit = ref(prefersReducedMotion() ? words.length : 0);

const pin = ref<HTMLElement | null>(null);
const flat = prefersReducedMotion();

// The text block pins while you scroll through `.manifesto-pin`; scroll
// progress through that runway maps one-to-one onto the highlighted words.
let raf = 0;
function update() {
  raf = 0;
  if (!pin.value || flat) return;
  const r = pin.value.getBoundingClientRect();
  const runway = r.height - (innerHeight - 64);
  const p = runway > 0 ? clamp(-(r.top - 64) / runway) : 1;
  // Everything is lit a little before the pin releases, so the finished line gets a beat.
  lit.value = Math.round(clamp(p / 0.88) * words.length);
}
const onScroll = () => {
  if (!raf) raf = requestAnimationFrame(update);
};
onMounted(() => {
  update();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
});
onBeforeUnmount(() => {
  removeEventListener("scroll", onScroll);
  removeEventListener("resize", onScroll);
  cancelAnimationFrame(raf);
});

const rules = [
  { name: "Real projects", text: "We work on problems from society and industry, and gain practical, industry-relevant skills." },
  { name: "Real research", text: "Journal papers, conference papers, patents, copyrights and technology disclosures." },
  { name: "Real community", text: "Workshops, hackathons and collaborations with startups, labs and institutions." },
];
</script>

<template>
  <section id="manifesto" class="manifesto paper">
    <div ref="pin" class="manifesto-pin" :class="flat && 'flat'">
      <div class="manifesto-stick">
        <div class="lp-wrap manifesto-grid">
          <div class="manifesto-side">
            <p class="eyebrow">Manifesto</p>
            <div class="define">
              <span class="mono"><span class="spark" />logic play, n.</span>
              <p>A community for students who are curious about AI, passionate about innovation, and set on turning ideas into impactful solutions.</p>
            </div>
          </div>
          <p class="manifesto-text">
            <template v-for="(w, i) in words" :key="i">
              <span class="w" :class="[w.key && 'key', i < lit && 'lit']">{{ w.text }}</span>{{ " " }}
            </template>
          </p>
        </div>
      </div>
    </div>
    <div class="lp-wrap manifesto-rules">
      <div class="manifesto-foot">
        <div v-for="r in rules" :key="r.name" class="rule">
          <b>{{ r.name }}</b><span>{{ r.text }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
