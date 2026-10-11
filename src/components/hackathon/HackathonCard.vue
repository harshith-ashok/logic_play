<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getLatestHackathon, getRegistrationStatus } from "../../lib/hackathon/api";
import type { RegistrationStatus } from "../../lib/hackathon/types";
import Badge from "../ui/Badge.vue";

// Registration entry point for the newest hackathon, used on the Events page.
// Renders nothing while loading, when there's no hackathon, or on any error:
// it's a bonus on the page, never a failure state.
const slug = ref("");
const status = ref<RegistrationStatus | null>(null);

onMounted(async () => {
  try {
    const latest = await getLatestHackathon();
    if (!latest) return;
    const s = await getRegistrationStatus(latest.slug);
    if (s) {
      slug.value = latest.slug;
      status.value = s;
    }
  } catch {
    /* leave the card hidden */
  }
});
</script>

<template>
  <div
    v-if="status"
    class="reveal-block card mt-8 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6 md:mt-9"
  >
    <div class="min-w-0">
      <div class="label">Hackathon · {{ status.open ? "registration open" : "registration closed" }}</div>
      <div class="mt-1 text-xl font-semibold">{{ status.name }}</div>
      <p v-if="status.description" class="mt-1 max-w-[56ch] text-sm text-fg-muted">{{ status.description }}</p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Badge v-if="status.open" :to="`/hackathon/${slug}/register`" tone="solid" size="md" interactive arrow>
        Register your team
      </Badge>
      <Badge :to="`/stack-roulette/${slug}`" size="md" interactive>Stack Roulette</Badge>
    </div>
  </div>
</template>
