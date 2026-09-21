<script setup lang="ts">
import type { TeamMember } from "../../composables/useTeamMembers";

defineProps<{ member: TeamMember }>();
</script>

<template>
  <div
    class="team-card group relative border-r border-b border-border bg-bg p-5 transition-colors duration-300 hover:bg-bg-elevated sm:p-6"
  >
    <span
      class="absolute top-4 right-4 font-mono text-fg-subtle transition-[color,rotate,scale] duration-500 group-hover:scale-125 group-hover:rotate-135 group-hover:text-accent"
      aria-hidden="true"
    >
      +
    </span>
    <h4 class="mb-1 pr-6 text-base font-semibold" :class="!member.filled && 'text-fg-subtle'">
      {{ member.name }}
    </h4>
    <div class="mb-2 font-mono text-[11.5px] tracking-wide text-accent uppercase">
      {{ member.role }}
    </div>
    <p class="text-[13px] text-fg-subtle">{{ member.focus }}</p>
  </div>
</template>
