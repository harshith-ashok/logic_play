<script setup lang="ts">
import { useTheme } from "../../composables/useTheme";

const { theme, toggle } = useTheme();
</script>

<template>
  <button
    type="button"
    class="grid h-10 w-10 shrink-0 cursor-pointer place-items-center border border-border bg-transparent text-fg-muted transition-[border-color,color] duration-200 hover:border-fg-muted hover:text-fg sm:h-9 sm:w-9"
    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <svg
      v-if="theme === 'dark'"
      viewBox="0 0 24 24"
      class="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      class="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  </button>
</template>
