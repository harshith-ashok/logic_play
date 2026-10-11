<script setup lang="ts">
defineProps<{ stats: { teams: number; cap: number; participants: number; drawn: number; undrawn: number } }>();
</script>

<template>
  <dl class="glass-surface grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
    <div class="p-5">
      <dt class="label">Teams</dt>
      <dd class="mt-2 font-display text-3xl font-black">{{ stats.teams }}<span class="text-fg-subtle"> / {{ stats.cap }}</span></dd>
    </div>
    <div class="p-5">
      <dt class="label">Participants</dt>
      <dd class="mt-2 font-display text-3xl font-black">{{ stats.participants }}</dd>
    </div>
    <div class="p-5">
      <dt class="label">Drawn</dt>
      <dd class="mt-2 font-display text-3xl font-black">{{ stats.drawn }}</dd>
    </div>
    <div class="p-5">
      <dt class="label">Not drawn</dt>
      <dd class="mt-2 font-display text-3xl font-black" :class="stats.undrawn ? 'text-accent' : ''">{{ stats.undrawn }}</dd>
    </div>
  </dl>
</template>
