<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="reveal max-w-2xl">
    <p class="text-xs uppercase tracking-[0.2em] text-accent-blue">{{ eyebrow }}</p>
    <h2 class="mt-3 text-3xl font-medium tracking-tight text-text sm:text-4xl">{{ title }}</h2>
    <p v-if="description" class="mt-4 leading-relaxed text-muted">{{ description }}</p>
  </div>
</template>
