<script setup lang="ts">
import TeamCard from "./TeamCard.vue";
import type { TeamMember } from "../../composables/useTeamMembers";

defineProps<{ members: TeamMember[] }>();
</script>

<template>
  <!-- Per-cell borders (not a 1px gap over a filled backdrop) so a ragged last row stays clean. -->
  <div class="grid grid-cols-1 border-t border-l border-border min-[540px]:grid-cols-2 lg:grid-cols-3">
    <TeamCard v-for="member in members" :key="member.id" :member="member" />
  </div>
</template>
