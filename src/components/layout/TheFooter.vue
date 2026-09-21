<script setup lang="ts">
import bigWhite from "../../assets/brand/wordmark.webp";

const links = [
  { to: "/gallery", label: "Gallery" },
  { to: "/events", label: "Events" },
  // { to: "/press", label: "Press" },
  { to: "/team", label: "Team" },
];

// TBA: swap in real handles once socials exist.
const socials = [{ label: "Instagram", href: "instagram.com/logic_play/" }];

const chip =
  "border border-border px-3 py-2.5 font-mono text-xs uppercase text-fg-muted transition-[background-color,border-color,color,translate] duration-200 hover:-translate-y-0.5 hover:border-fg hover:bg-fg hover:text-bg";
</script>

<template>
  <footer class="relative z-10 border-t border-border py-10">
    <div class="wrap">
      <div
        class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
      >
        <router-link
          to="/"
          class="flex items-center gap-2.5 border border-fg px-2.5 py-1.5"
          aria-label="Logic Play home"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-accent" />
          <img
            :src="bigWhite"
            alt="Logic Play"
            width="75"
            height="16"
            class="brand-mark h-4 w-auto"
            loading="lazy"
          />
        </router-link>

        <nav class="flex flex-wrap gap-2.5" aria-label="Footer">
          <router-link
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :class="chip"
            >{{ link.label }}</router-link
          >
        </nav>

        <div class="flex flex-wrap gap-2.5">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href"
            target="_blank"
            rel="noopener"
            :class="chip"
            >{{ s.label }}</a
          >
        </div>
      </div>

      <div
        class="mt-6 flex flex-col gap-2 font-mono text-[11.5px] text-fg-subtle sm:flex-row sm:justify-between"
      >
        <span
          >&copy; {{ new Date().getFullYear() }} Logic Play. All rights
          reserved.</span
        >
        <span>Built by people who ship.</span>
      </div>
    </div>
  </footer>
</template>
