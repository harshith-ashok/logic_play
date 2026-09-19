<script setup lang="ts">
import { ref } from "vue";
import Badge from "../components/ui/Badge.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
import { about, boilerplate, brandColors, contact } from "../data/press";

import transparentBigWhite from "../assets/transparent/big_white.png";
import transparentBigGray from "../assets/transparent/big_gray.png";
import transparentSmallWhite from "../assets/transparent/small_white.png";
import transparentSmallGray from "../assets/transparent/small_gray.png";
import solidBigWhite from "../assets/solid/big_white.png";
import solidBigGray from "../assets/solid/big_gray.png";
import solidSmallWhite from "../assets/solid/small_white.png";
import solidSmallGray from "../assets/solid/small_gray.png";

const logoPack = [
  { label: "Wordmark — Transparent / White", src: transparentBigWhite, file: "logicplay-wordmark-white.png" },
  { label: "Wordmark — Transparent / Gray", src: transparentBigGray, file: "logicplay-wordmark-gray.png" },
  { label: "Wordmark — Solid / White", src: solidBigWhite, file: "logicplay-wordmark-white-solid.png" },
  { label: "Wordmark — Solid / Gray", src: solidBigGray, file: "logicplay-wordmark-gray-solid.png" },
  { label: "LP Mark — Transparent / White", src: transparentSmallWhite, file: "logicplay-lp-white.png" },
  { label: "LP Mark — Transparent / Gray", src: transparentSmallGray, file: "logicplay-lp-gray.png" },
  { label: "LP Mark — Solid / White", src: solidSmallWhite, file: "logicplay-lp-white-solid.png" },
  { label: "LP Mark — Solid / Gray", src: solidSmallGray, file: "logicplay-lp-gray-solid.png" },
];

const section = ref<HTMLElement | null>(null);
useScrollReveal(section, { selector: ".press-block" });
</script>

<template>
  <div class="px-4 py-28 sm:px-6">
    <div ref="section" class="mx-auto max-w-6xl">
      <h1 class="mb-4 font-display text-3xl uppercase tracking-tight sm:text-5xl">
        Press &amp; Media Kit
      </h1>
      <p class="press-block mb-16 max-w-xl font-sans text-sm text-fg-muted">
        {{ boilerplate }}
      </p>

      <section class="press-block mb-16">
        <h2 class="mb-4 font-display text-xl uppercase tracking-tight">
          About Logic Play
        </h2>
        <p class="max-w-2xl font-sans text-sm leading-relaxed text-fg-muted">{{ about }}</p>
      </section>

      <section class="press-block mb-16">
        <h2 class="mb-6 font-display text-xl uppercase tracking-tight">
          Logo Pack
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            v-for="logo in logoPack"
            :key="logo.file"
            :href="logo.src"
            :download="logo.file"
            class="glass-surface relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl px-4 py-6 text-center transition-transform duration-200 hover:-translate-y-0.5 hover:bg-glass-hover"
            :style="{ transitionTimingFunction: 'var(--ease-mechanical)' }"
          >
            <img :src="logo.src" :alt="logo.label" loading="lazy" class="h-16 w-auto" />
            <span class="font-sans text-xs text-fg-muted">{{ logo.label }}</span>
            <Badge as="span" size="sm">Download</Badge>
          </a>
        </div>
      </section>

      <section class="press-block mb-16">
        <h2 class="mb-6 font-display text-xl uppercase tracking-tight">
          Brand Colors
        </h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="color in brandColors"
            :key="color.hex"
            class="flex flex-col gap-2"
          >
            <div
              class="glass-surface h-20 w-20 rounded-2xl transition-transform duration-200 hover:-translate-y-0.5"
              :style="{ backgroundColor: color.hex, transitionTimingFunction: 'var(--ease-mechanical)' }"
            />
            <span class="font-sans text-xs text-fg-muted">{{ color.name }}</span>
            <span class="font-sans text-xs uppercase text-fg-subtle">{{ color.hex }}</span>
          </div>
        </div>
      </section>

      <section class="press-block">
        <h2 class="mb-4 font-display text-xl uppercase tracking-tight">
          Press Inquiries
        </h2>
        <p class="font-sans text-sm text-fg-muted">
          {{ contact.name }}, {{ contact.role }} &mdash; contact: {{ contact.email }}
        </p>
      </section>
    </div>
  </div>
</template>
