<script setup lang="ts">
import { ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { team } from "../data/team";

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

      <div ref="grid" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Badge
          v-for="member in team"
          :key="member.role"
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
      </div>
    </div>
  </div>
</template>
