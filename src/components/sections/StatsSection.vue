<script setup lang="ts">
import { ref } from "vue";
import SectionHeading from "@/components/ui/SectionHeading.vue";
import StatCounter from "@/components/ui/StatCounter.vue";
import { useReveal } from "@/composables/useReveal";
import { stats } from "@/data/stats";

const section = ref<HTMLElement | null>(null);
useReveal(section, ".reveal");
</script>

<template>
  <section id="stats" ref="section" class="border-t border-border px-6 py-28">
    <div class="mx-auto max-w-6xl">
      <SectionHeading eyebrow="Statistics" title="The club, in numbers" />

      <div class="mt-16 grid grid-cols-2 gap-10 lg:grid-cols-4">
        <StatCounter v-for="stat in stats" :key="stat.label" :stat="stat" />
      </div>
    </div>
  </section>
</template>
