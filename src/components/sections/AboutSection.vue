<script setup lang="ts">
import { ref } from "vue";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import TiltCard from "@/components/ui/TiltCard.vue";
import { useReveal } from "@/composables/useReveal";

const section = ref<HTMLElement | null>(null);
useReveal(section, ".reveal");

const principles = [
  {
    title: "Build",
    description: "Ship real projects across AI, web, Web3, and security instead of stopping at tutorials.",
  },
  {
    title: "Break",
    description: "Push code until it fails, then figure out why. That's where the real learning happens.",
  },
  {
    title: "Learn",
    description: "Weekly workshops, pair sessions, and code reviews run by members, for members.",
  },
  {
    title: "Repeat",
    description: "Every cohort ships more, faster. The club compounds what the last one learned.",
  },
];
</script>

<template>
  <section id="about" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="About"
        title="A club for people who ship"
        description="Logic Play is a student-run technical club for builders who'd rather write code than talk about writing code. We run workshops, ship projects across six domains, and compete at hackathons together."
      />

      <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <TiltCard v-for="(principle, i) in principles" :key="principle.title" class="reveal">
          <span class="text-sm text-accent-violet">0{{ i + 1 }}</span>
          <h3 class="mt-4 text-lg text-text">{{ principle.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ principle.description }}</p>
        </TiltCard>
      </div>
    </div>
  </section>
</template>
