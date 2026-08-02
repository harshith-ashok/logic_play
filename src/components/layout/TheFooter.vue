<script setup lang="ts">
import Badge from "../ui/Badge.vue";
import GridBar from "../ui/GridBar.vue";
import smallWhite from "../../assets/transparent/big_white.png";

const links = [
  { to: "/gallery", label: "Gallery" },
  { to: "/events", label: "Events" },
  // { to: "/press", label: "Press" },
  { to: "/team", label: "Team" },
];

// TBA: swap in real handles once socials exist.
const socials = [
  { label: "Instagram", href: "#" },
  { label: "Discord", href: "#" },
  { label: "LinkedIn", href: "#" },
];
</script>

<template>
  <footer class="relative">
    <GridBar />
    <div class="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <div class="flex flex-col items-start justify-between gap-8 sm:flex-row">
        <div class="flex items-center gap-3">
          <img :src="smallWhite" alt="Logic Play" class="brand-mark h-9 w-auto" />
          <!-- <HalftoneMark :size="18" :opacity="0.4" color="var(--color-accent)" /> -->
        </div>

        <nav class="flex flex-wrap gap-2">
          <Badge
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            size="sm"
            interactive
          >
            {{ link.label }}
          </Badge>
        </nav>

        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="social in socials"
            :key="social.label"
            as="a"
            :href="social.href"
            size="sm"
            interactive
          >
            {{ social.label }}
          </Badge>
        </div>
      </div>

      <div
        class="flex flex-col gap-2 border-t border-border pt-6 font-sans text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between"
      >
        <p>
          &copy; {{ new Date().getFullYear() }} Logic Play. All rights reserved.
        </p>
        <p>Built by people who ship.</p>
      </div>
    </div>
  </footer>
</template>
