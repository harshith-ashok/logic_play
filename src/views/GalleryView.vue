<script setup lang="ts">
import { ref } from "vue";
import HalftoneMark from "../components/ui/HalftoneMark.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { galleryItems } from "../data/gallery";
import { formatDate } from "../utils/date";

const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: ".gallery-tile", stagger: 0.05 });

// Pad the grid with placeholder tiles so the layout reads intentional even
// with zero real photos yet.
const placeholderCount = Math.max(6 - galleryItems.length, 3);
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">
        Gallery
      </h1>
      <p class="mb-12 max-w-xl font-sans text-sm text-fg-muted">
        Build sessions, hackathons, team shots — as they happen, they land
        here.
      </p>

      <div ref="grid" class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div
          v-for="item in galleryItems"
          :key="item.id"
          class="glass-surface gallery-tile relative aspect-square overflow-hidden rounded-2xl"
        >
          <img
            :src="item.image"
            :alt="item.alt"
            loading="lazy"
            width="400"
            height="400"
            class="h-full w-full object-cover"
          />
          <div
            v-if="item.title || item.date"
            class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-bg/90 to-transparent px-3 pb-2 pt-6"
          >
            <p v-if="item.title" class="font-display text-xs uppercase tracking-tight">
              {{ item.title }}
            </p>
            <p v-if="item.date" class="font-sans text-[11px] text-fg-subtle">
              {{ formatDate(item.date) }}
            </p>
          </div>
        </div>

        <div
          v-for="n in placeholderCount"
          :key="`placeholder-${n}`"
          class="gallery-tile flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong text-center"
        >
          <HalftoneMark :size="32" :opacity="0.3" />
          <span class="font-display text-xs uppercase tracking-tight text-fg-subtle">
            Photo coming soon
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
