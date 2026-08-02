<script setup lang="ts">
import { ref } from "vue";
import Badge from "../ui/Badge.vue";
import GridBar from "../ui/GridBar.vue";
import smallWhite from "../../assets/transparent/big_white.png";

// Press stays a real route (linked from the footer, and directly shareable)
// but is deliberately left out of primary nav — it's a reference page, not
// a destination visitors need one click away.
const links = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/events", label: "Events" },
  { to: "/team", label: "Team" },
];

const open = ref(false);
</script>

<template>
  <header class="glass-surface fixed inset-x-0 top-0 z-50 overflow-hidden">
    <GridBar />
    <nav
      class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
    >
      <router-link to="/" class="flex items-center gap-2" @click="open = false">
        <img :src="smallWhite" alt="Logic Play" class="h-8 w-auto sm:h-8" />
      </router-link>

      <ul class="hidden items-center gap-2 md:flex">
        <li v-for="link in links" :key="link.to">
          <Badge :to="link.to" size="sm" interactive>
            {{ link.label }}
          </Badge>
        </li>
      </ul>

      <div class="hidden md:block">
        <Badge as="a" href="#join" tone="solid" size="sm" interactive arrow>
          Join the Club
        </Badge>
      </div>

      <button
        type="button"
        class="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        aria-label="Toggle menu"
        @click="open = !open"
      >
        <span
          class="h-0.5 w-6 bg-fg transition-transform duration-200"
          :class="open && 'translate-y-2 rotate-45'"
        />
        <span
          class="h-0.5 w-6 bg-fg transition-opacity duration-200"
          :class="open && 'opacity-0'"
        />
        <span
          class="h-0.5 w-6 bg-fg transition-transform duration-200"
          :class="open && '-translate-y-2 -rotate-45'"
        />
      </button>
    </nav>

    <div v-if="open" class="border-t border-border px-4 pb-4 md:hidden">
      <ul class="flex flex-col gap-2 pt-4">
        <li v-for="link in links" :key="link.to">
          <Badge
            :to="link.to"
            size="sm"
            interactive
            class="w-full"
            @click="open = false"
          >
            {{ link.label }}
          </Badge>
        </li>
        <li>
          <Badge
            as="a"
            href="#join"
            tone="solid"
            size="sm"
            interactive
            arrow
            class="w-full"
            @click="open = false"
          >
            Join the Club
          </Badge>
        </li>
      </ul>
    </div>
  </header>
</template>
