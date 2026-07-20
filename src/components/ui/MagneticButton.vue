<script setup lang="ts">
import { ref } from "vue";
import { useMagnetic } from "@/composables/useMagnetic";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary";
    href?: string;
  }>(),
  { variant: "primary", href: "#" },
);

const el = ref<HTMLElement | null>(null);
useMagnetic(el, 0.3);
</script>

<template>
  <a
    ref="el"
    :href="props.href"
    class="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm tracking-tight transition-colors duration-300"
    :class="
      props.variant === 'primary'
        ? 'bg-text text-bg hover:opacity-90'
        : 'border border-border text-text hover:border-border-hover hover:bg-surface'
    "
  >
    <slot />
  </a>
</template>
