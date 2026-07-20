<script setup lang="ts">
import { ref } from "vue";
import { ArrowUpRight } from "@lucide/vue";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import TiltCard from "@/components/ui/TiltCard.vue";
import { useReveal } from "@/composables/useReveal";
import { projects } from "@/data/projects";

const section = ref<HTMLElement | null>(null);
useReveal(section, ".reveal");
</script>

<template>
  <section id="projects" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Projects"
        title="Shipped by members"
        description="A sample of what the club has built across domains, from prototypes to production."
      />

      <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TiltCard v-for="project in projects" :key="project.name" class="reveal">
          <a :href="project.href" class="block">
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="text-xs uppercase tracking-[0.15em] text-accent-violet">{{ project.domain }}</span>
                <h3 class="mt-3 text-lg text-text">{{ project.name }}</h3>
              </div>
              <ArrowUpRight :size="18" class="mt-1 shrink-0 text-muted transition-colors duration-200 group-hover:text-text" />
            </div>
            <p class="mt-3 text-sm leading-relaxed text-muted">{{ project.description }}</p>
            <ul class="mt-5 flex flex-wrap gap-2">
              <li
                v-for="tech in project.stack"
                :key="tech"
                class="rounded-full border border-border px-3 py-1 text-xs text-muted"
              >
                {{ tech }}
              </li>
            </ul>
          </a>
        </TiltCard>
      </div>
    </div>
  </section>
</template>
