<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { galleryItems, type GalleryItem } from "../data/gallery";
import { formatDate } from "../utils/date";

const root = ref<HTMLElement | null>(null);
useScrollReveal(root, { selector: ".tile", stagger: 0.05 });

// Filter chips exist only when items actually carry a category.
const categories = computed(() => [...new Set(galleryItems.map((i) => i.category).filter(Boolean))] as string[]);
const filter = ref("all");
const visible = computed(() =>
  filter.value === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter.value),
);

// Pad the grid with placeholder tiles so the layout reads intentional even
// with zero real photos yet (never faked with stock images).
const placeholderCount = computed(() => (galleryItems.length ? 0 : 6));

// ---- lightbox ----
const current = ref<number | null>(null);
const item = computed<GalleryItem | null>(() => (current.value === null ? null : (visible.value[current.value] ?? null)));
const closeBtn = ref<HTMLButtonElement | null>(null);
let opener: HTMLElement | null = null;

function open(i: number) {
  opener = document.activeElement as HTMLElement | null;
  current.value = i;
}
function close() {
  current.value = null;
  opener?.focus();
}
function step(d: number) {
  if (current.value === null || !visible.value.length) return;
  current.value = (current.value + d + visible.value.length) % visible.value.length;
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
  else if (e.key === "ArrowLeft") step(-1);
  else if (e.key === "ArrowRight") step(1);
}

watch(current, async (v, old) => {
  const isOpen = v !== null;
  if (isOpen === (old !== null && old !== undefined)) return;
  document.documentElement.style.overflow = isOpen ? "hidden" : "";
  if (isOpen) {
    document.addEventListener("keydown", onKey);
    await nextTick();
    closeBtn.value?.focus();
  } else {
    document.removeEventListener("keydown", onKey);
  }
});

// Swipe left/right in the lightbox on touch screens.
let touchX = 0;
const onTouchStart = (e: TouchEvent) => (touchX = e.touches[0].clientX);
const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
};

onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <div ref="root">
    <div class="wrap page-hero">
      <div class="eyebrow">RECAPS</div>
      <h1 class="page-title">Gallery</h1>
      <p class="page-sub">
        Build sessions, hackathons, team shots — as they happen, they land here.
        <template v-if="galleryItems.length">Tap any tile for the full view.</template>
      </p>

      <div v-if="categories.length" class="mt-8 flex flex-wrap gap-2.5 md:mt-10">
        <button
          v-for="c in ['all', ...categories]"
          :key="c"
          type="button"
          class="min-h-10 cursor-pointer border px-3.5 font-mono text-xs font-semibold tracking-wide uppercase transition-[border-color,color,background-color,translate] duration-200 hover:-translate-y-0.5"
          :class="filter === c ? 'border-accent bg-accent text-white' : 'border-border text-fg-muted hover:border-fg-muted hover:text-fg'"
          @click="filter = c; current = null"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <div class="wrap pb-16 md:pb-20">
      <div class="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 md:grid-cols-3 md:gap-3.5">
        <button
          v-for="(g, i) in visible"
          :key="g.id"
          type="button"
          class="tile group relative aspect-4/3 cursor-pointer overflow-hidden border border-border transition-colors duration-300 hover:border-accent-dim"
          :aria-label="`Open ${g.title}`"
          @click="open(i)"
        >
          <img
            :src="g.image"
            :alt="g.alt"
            loading="lazy"
            decoding="async"
            width="800"
            height="600"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span class="absolute top-3.5 left-3.5 font-mono text-[11px] tracking-wide text-white/70">
            LP · {{ String(i + 1).padStart(2, "0") }}
          </span>
          <span
            class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-4 pt-10 text-left"
          >
            <span v-if="g.category" class="mb-1 block font-mono text-[10px] tracking-widest text-amber uppercase">{{ g.category }}</span>
            <span class="block text-[15px] font-semibold text-white">{{ g.title }}</span>
            <span v-if="g.date" class="mt-0.5 block font-mono text-[10.5px] text-white/60">{{ formatDate(g.date) }}</span>
          </span>
        </button>

        <div
          v-for="n in placeholderCount"
          :key="`placeholder-${n}`"
          class="tile relative flex aspect-4/3 flex-col items-center justify-center gap-3 border border-dashed border-border-strong text-center"
        >
          <span class="absolute top-3.5 left-3.5 font-mono text-[11px] tracking-wide text-fg-subtle">
            LP · {{ String(n).padStart(2, "0") }}
          </span>
          <HalftoneMark :size="30" :opacity="0.5" color="var(--color-accent)" />
          <span class="font-mono text-xs tracking-wide text-fg-subtle uppercase">Photo coming soon</span>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition name="lb">
      <div
        v-if="item"
        class="fixed inset-0 z-120 flex items-center justify-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        @click.self="close"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <button
          ref="closeBtn"
          type="button"
          class="absolute top-4 right-4 grid h-11 w-11 cursor-pointer place-items-center border border-border-strong bg-bg/60 text-fg transition-[border-color,rotate] duration-300 hover:rotate-90 hover:border-accent"
          aria-label="Close"
          @click="close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <figure class="w-full max-w-190">
          <img :src="item.image" :alt="item.alt" class="max-h-[70svh] w-full border border-border-strong bg-bg object-contain" />
          <figcaption class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span v-if="item.category" class="mb-1.5 block font-mono text-[11px] tracking-widest text-amber uppercase">{{ item.category }}</span>
              <h3 class="text-xl font-semibold text-fg">{{ item.title }}</h3>
              <span v-if="item.date" class="font-mono text-xs text-fg-subtle">{{ formatDate(item.date) }}</span>
            </div>
            <div class="flex gap-2.5">
              <button type="button" class="grid h-11 w-11 cursor-pointer place-items-center border border-border-strong text-fg transition-[background-color,border-color] duration-200 hover:border-accent hover:bg-accent" aria-label="Previous" @click="step(-1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button type="button" class="grid h-11 w-11 cursor-pointer place-items-center border border-border-strong text-fg transition-[background-color,border-color] duration-200 hover:border-accent hover:bg-accent" aria-label="Next" @click="step(1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </figcaption>
        </figure>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.25s var(--ease-mechanical);
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
</style>
