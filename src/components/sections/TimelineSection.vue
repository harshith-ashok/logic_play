<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import { events } from "@/data/events";

gsap.registerPlugin(ScrollTrigger);

const section = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);
let ctx: gsap.Context | undefined;

onMounted(() => {
  if (!section.value || !track.value) return;
  ctx = gsap.context(() => {
    gsap.set(".timeline-line-fill", { scaleY: 0, transformOrigin: "top" });
    gsap.to(".timeline-line-fill", {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: track.value,
        start: "top 70%",
        end: "bottom 70%",
        scrub: 0.6,
      },
    });

    gsap.utils.toArray<HTMLElement>(".timeline-item").forEach((item) => {
      gsap.set(item, { opacity: 0, y: 24 });
      gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: item,
          start: "top 85%",
          once: true,
        },
      });
    });
  }, section.value);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <section id="timeline" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Timeline"
        title="What's on this year"
        description="From kickoff to demo day, here's how the club's calendar plays out."
      />

      <div ref="track" class="relative mt-16 pl-8">
        <div class="absolute inset-y-0 left-0 w-px bg-border" />
        <div class="timeline-line-fill absolute inset-y-0 left-0 w-px bg-linear-to-b from-accent-blue to-accent-violet" />

        <div
          v-for="event in events"
          :key="event.title"
          class="timeline-item relative mb-12 last:mb-0"
        >
          <span class="absolute -left-8.5 top-1 h-2.5 w-2.5 rounded-full border-2 border-accent-blue bg-bg" />
          <span class="text-xs uppercase tracking-[0.15em] text-accent-blue">{{ event.date }}</span>
          <h3 class="mt-2 text-lg text-text">{{ event.title }}</h3>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-muted">{{ event.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
