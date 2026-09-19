<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    as?: string;
    /** `glass`: translucent blurred pill/card (default, used everywhere). `solid`: opaque white pill reserved for primary CTAs. */
    tone?: "glass" | "solid";
    size?: "sm" | "md" | "lg";
    href?: string;
    to?: string;
    interactive?: boolean;
    /** Stack content vertically, left-aligned, as a rounded card instead of the default centered pill (e.g. perk/event/team cards). */
    column?: boolean;
    /** Append a trailing arrow, used on primary CTAs. */
    arrow?: boolean;
  }>(),
  {
    as: "div",
    tone: "glass",
    size: "md",
    interactive: false,
    column: false,
    arrow: false,
  },
);

const tag = computed(() => {
  if (props.href) return "a";
  if (props.to) return "router-link";
  return props.as;
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return props.column ? "rounded-2xl px-4 py-3 text-xs" : "px-4 py-2 text-xs";
    case "lg":
      return props.column ? "rounded-3xl px-8 py-8 text-lg" : "px-8 py-4 text-base";
    default:
      return props.column ? "rounded-2xl px-6 py-6 text-sm" : "px-5 py-2.5 text-sm";
  }
});

const toneClasses = computed(() =>
  props.tone === "solid"
    ? "bg-fg text-bg"
    : "glass-surface relative overflow-hidden text-fg",
);
</script>

<template>
  <component
    :is="tag"
    :href="href"
    :to="to"
    class="flex gap-2 font-display uppercase tracking-tight leading-none transition-all duration-200"
    :class="[
      sizeClasses,
      toneClasses,
      !column && 'rounded-sm',
      column
        ? 'flex-col items-start justify-start text-left normal-case'
        : 'inline-flex items-center justify-center',
      interactive &&
        tone === 'glass' &&
        'cursor-pointer hover:border-border-strong hover:bg-glass-hover',
      interactive &&
        tone === 'solid' &&
        'cursor-pointer hover:opacity-85',
    ]"
    :style="{ transitionTimingFunction: 'var(--ease-mechanical)' }"
  >
    <slot />
    <span v-if="arrow" aria-hidden="true">&rarr;</span>
  </component>
</template>
