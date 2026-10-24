<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{ title: string; wide?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const panel = ref<HTMLElement | null>(null);
let opener: HTMLElement | null = null;

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(async () => {
  opener = document.activeElement as HTMLElement | null;
  document.documentElement.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
  await nextTick();
  panel.value?.focus();
});
onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  document.removeEventListener("keydown", onKey);
  opener?.focus?.();
});
</script>

<template>
  <div
    class="fixed inset-0 z-120 flex items-start justify-center overflow-y-auto bg-black/85 p-3 sm:p-8"
    @mousedown.self="emit('close')"
  >
    <div
      ref="panel"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      class="ink relative my-auto w-full border border-border-strong outline-none"
      :class="wide ? 'max-w-5xl' : 'max-w-2xl'"
    >
      <div class="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
        <h2 class="font-display text-lg sm:text-2xl">{{ title }}</h2>
        <button
          type="button"
          class="grid h-10 w-10 shrink-0 cursor-pointer place-items-center border border-border-strong bg-transparent text-fg transition-[border-color,rotate] duration-300 hover:rotate-90 hover:border-accent"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div class="px-5 py-6 sm:px-7">
        <slot />
      </div>
    </div>
  </div>
</template>
