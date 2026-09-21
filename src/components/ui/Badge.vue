<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    as?: string;
    /** `glass`: bordered outline button/tag (default). `solid`: filled red primary CTA. */
    tone?: "glass" | "solid";
    size?: "sm" | "md" | "lg";
    href?: string;
    to?: string;
    interactive?: boolean;
    /** Stack content vertically, left-aligned, as a card instead of the default centered inline button. */
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
      return props.column ? "p-4 text-xs" : "min-h-9 px-3.5 py-2 text-[11px]";
    case "lg":
      return props.column ? "p-8 text-base" : "min-h-12 px-6 py-3.5 text-[13px]";
    default:
      return props.column ? "p-6 text-sm" : "min-h-10 px-4 py-2.5 text-xs";
  }
});

const toneClasses = computed(() =>
  props.tone === "solid"
    ? "border border-accent bg-accent text-white"
    : "glass-surface text-fg",
);
</script>

<template>
  <component
    :is="tag"
    :href="href"
    :to="to"
    class="gap-2 leading-none transition-[background-color,border-color,color,translate,box-shadow] duration-200"
    :class="[
      sizeClasses,
      toneClasses,
      column
        ? 'flex flex-col items-start justify-start text-left font-sans normal-case'
        : 'inline-flex items-center justify-center font-mono font-semibold tracking-wide uppercase',
      interactive &&
        tone === 'glass' &&
        'cursor-pointer hover:border-border-strong hover:bg-glass-hover hover:-translate-y-0.5',
      interactive &&
        tone === 'solid' &&
        'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(255,61,46,0.6)] active:translate-y-0',
    ]"
    :style="{ transitionTimingFunction: 'var(--ease-mechanical)' }"
  >
    <slot />
    <span v-if="arrow" aria-hidden="true">&rarr;</span>
  </component>
</template>
