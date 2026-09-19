<script setup lang="ts">
import Badge from "./Badge.vue";
import HalftoneMark from "./HalftoneMark.vue";
import type { TeamMember } from "../../composables/useTeamMembers";

defineProps<{ member: TeamMember }>();
</script>

<template>
  <Badge
    column
    class="team-card gap-3"
    :class="!member.filled && 'border-dashed border-border-strong'"
  >
    <HalftoneMark
      :size="24"
      :opacity="member.filled ? 0.9 : 0.25"
      :color="member.filled ? 'var(--color-accent)' : 'currentColor'"
    />
    <span
      class="font-display text-lg uppercase tracking-tight"
      :class="!member.filled && 'text-fg-subtle'"
    >
      {{ member.name }}
    </span>
    <span class="font-sans text-sm tracking-normal text-fg-muted">
      {{ member.role }}
    </span>
    <span class="font-sans text-xs tracking-normal text-fg-subtle">
      {{ member.focus }}
    </span>
  </Badge>
</template>
