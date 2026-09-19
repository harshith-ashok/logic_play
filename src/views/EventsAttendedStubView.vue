<script setup lang="ts">
import GridBar from "../components/ui/GridBar.vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-2xl">
      <div
        class="glass-surface relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl px-6 py-20 text-center sm:px-10"
      >
        <HalftoneMark :size="40" color="var(--color-accent)" />
        <h1 class="font-display text-xl uppercase tracking-tight sm:text-2xl">
          Events Attended
        </h1>
        <p class="max-w-sm font-sans text-sm text-fg-muted">
          Your event attendance history is coming in a later phase.
        </p>
      </div>
    </div>
    <GridBar class="mt-24" />
  </div>
</template>
