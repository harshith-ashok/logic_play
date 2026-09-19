<script setup lang="ts">
import { ref } from "vue";
import TeamCard from "../components/ui/TeamCard.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { useTeamMembers } from "../composables/useTeamMembers";

const { members, loading, error } = useTeamMembers();

const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: ".team-card" });
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <h1
        class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl"
      >
        Team
      </h1>
      <p class="mb-12 max-w-xl font-sans text-sm text-fg-muted">
        The leads building Logic Play. Recruiting for open roles is ongoing.
      </p>

      <p v-if="loading" class="font-display text-xs uppercase tracking-tight text-fg-subtle">
        Loading&hellip;
      </p>
      <p v-else-if="error" class="font-display text-xs uppercase tracking-tight text-fg-subtle">
        {{ error }}
      </p>

      <div v-else ref="grid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TeamCard v-for="member in members" :key="member.id" :member="member" />
      </div>
    </div>
  </div>
</template>
