<script setup lang="ts">
import { ref } from "vue";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import TiltCard from "@/components/ui/TiltCard.vue";
import { useReveal } from "@/composables/useReveal";
import { team } from "@/data/team";

const section = ref<HTMLElement | null>(null);
useReveal(section, ".reveal");
</script>

<template>
  <section id="team" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Team"
        title="Run by members"
        description="A small group of students keeping the domains, events, and infrastructure running."
      />

      <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TiltCard v-for="member in team" :key="member.name" class="reveal">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-linear-to-br from-accent-blue/20 to-accent-violet/20 text-sm text-text"
          >
            {{ member.initials }}
          </div>
          <h3 class="mt-4 text-lg text-text">{{ member.name }}</h3>
          <p class="mt-1 text-sm text-muted">{{ member.role }}</p>
          <div class="mt-4 flex gap-4">
            <a
              v-for="link in member.links"
              :key="link.label"
              :href="link.href"
              class="text-xs text-muted underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-text hover:decoration-text"
            >
              {{ link.label }}
            </a>
          </div>
        </TiltCard>
      </div>
    </div>
  </section>
</template>
