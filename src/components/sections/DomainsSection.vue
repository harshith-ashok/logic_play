<script setup lang="ts">
import { ref } from "vue";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import TiltCard from "@/components/ui/TiltCard.vue";
import { useReveal } from "@/composables/useReveal";
import { domains } from "@/data/domains";

const section = ref<HTMLElement | null>(null);
useReveal(section, ".reveal");
</script>

<template>
  <section id="domains" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Domains"
        title="Seven domains, one club"
        description="Every member picks a domain to go deep in while still building alongside the rest of the club."
      />

      <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TiltCard v-for="domain in domains" :key="domain.name" class="reveal">
          <component :is="domain.icon" :size="22" class="text-accent-blue" />
          <h3 class="mt-4 text-lg text-text">{{ domain.name }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ domain.description }}</p>
        </TiltCard>
      </div>
    </div>
  </section>
</template>
