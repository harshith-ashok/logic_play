<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    as?: string;
    /** `glass`: outlined button/tag (default). `solid`: filled paper primary CTA. */
    tone?: "glass" | "solid";
    size?: "sm" | "md" | "lg";
    href?: string;
    to?: string;
    interactive?: boolean;
    /** Stack content vertically, left-aligned, as a flat card instead of the default slanted button. */
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
      return props.column ? "p-4 text-xs" : "min-h-9 px-4 py-2 text-[10.5px]";
    case "lg":
      return props.column ? "p-8 text-base" : "min-h-12 px-7 py-3.5 text-[12px]";
    default:
      return props.column ? "p-6 text-sm" : "min-h-10 px-5 py-2.5 text-[11px]";
  }
});

// The button shapes are parallelograms cut at the logo's slant; the inner span
// counter-skews so the label stays upright. Cards (`column`) stay rectangular.
const toneClasses = computed(() => {
  if (props.column) return "glass-surface text-fg";
  return props.tone === "solid"
    ? "bg-fg text-bg -skew-x-[11deg]"
    : "bg-transparent text-fg -skew-x-[11deg] shadow-[inset_0_0_0_1.5px_currentColor]";
});

const hoverClasses = computed(() => {
  if (!props.interactive) return "";
  const shadow =
    "hover:shadow-[-4px_0_0_var(--cyan),4px_0_0_var(--magenta),0_3px_0_var(--yellow)] focus-visible:shadow-[-4px_0_0_var(--cyan),4px_0_0_var(--magenta),0_3px_0_var(--yellow)]";
  if (props.column) return "cursor-pointer hover:border-border-strong hover:bg-glass-hover";
  return props.tone === "solid"
    ? `cursor-pointer ${shadow}`
    : `cursor-pointer hover:shadow-[inset_0_0_0_1.5px_currentColor,-4px_0_0_var(--cyan),4px_0_0_var(--magenta)]`;
});
</script>

<template>
  <component
    :is="tag"
    :href="href"
    :to="to"
    class="leading-none transition-[background-color,border-color,color,box-shadow] duration-300"
    :class="[
      sizeClasses,
      toneClasses,
      hoverClasses,
      column
        ? 'flex flex-col items-start justify-start gap-2 text-left font-sans normal-case'
        : 'inline-flex items-center justify-center font-mono font-medium tracking-[0.14em] uppercase',
    ]"
    :style="{ transitionTimingFunction: 'var(--ease-mechanical)' }"
  >
    <template v-if="column"><slot /></template>
    <span v-else class="inline-flex items-center justify-center gap-2.5 skew-x-[11deg]">
      <slot />
      <span v-if="arrow" aria-hidden="true">&rarr;</span>
    </span>
  </component>
</template>
