<script setup lang="ts">
import { ref } from "vue";
import { useCounter } from "@/composables/useCounter";
import type { Stat } from "@/data/stats";

const props = defineProps<{ stat: Stat }>();

const el = ref<HTMLElement | null>(null);
useCounter(el, props.stat.value, { suffix: props.stat.suffix });
</script>

<template>
  <div class="reveal">
    <div class="text-5xl font-medium tracking-tight text-text sm:text-6xl">
      <span ref="el">0</span>
    </div>
    <p class="mt-3 text-sm text-muted">{{ stat.label }}</p>
  </div>
</template>
