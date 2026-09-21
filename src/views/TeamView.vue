<script setup lang="ts">
import { ref } from "vue";
import TeamGrid from "../components/ui/TeamGrid.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { useTeamMembers } from "../composables/useTeamMembers";

const { members, loading, error } = useTeamMembers();

const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: ".team-card", stagger: 0.06 });
</script>

<template>
  <div>
    <div class="wrap page-hero">
      <div class="eyebrow">PEOPLE</div>
      <h1 class="page-title">Team</h1>
      <p class="page-sub">The leads building Logic Play. Recruiting for open roles is ongoing.</p>
    </div>

    <div class="wrap pb-16 md:pb-24">
      <p v-if="loading" class="font-mono text-xs text-fg-subtle uppercase">Loading&hellip;</p>
      <p v-else-if="error" class="font-mono text-xs text-accent uppercase">{{ error }}</p>
      <div v-else ref="grid">
        <TeamGrid :members="members" />
      </div>
    </div>
  </div>
</template>
