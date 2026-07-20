<script setup lang="ts">
import { ref } from "vue";
import { Moon, Sun, Menu, X } from "@lucide/vue";
import { useTheme } from "@/composables/useTheme";

const { theme, toggle } = useTheme();
const open = ref(false);

const links = [
  { label: "About", href: "#about" },
  { label: "Domains", href: "#domains" },
  { label: "Projects", href: "#projects" },
  { label: "Timeline", href: "#timeline" },
  { label: "Team", href: "#team" },
];

function closeMenu() {
  open.value = false;
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
    <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <a href="#" class="text-sm font-medium tracking-tight text-text">
        logic<span class="text-accent-blue">_</span>play
      </a>

      <ul class="hidden items-center gap-8 md:flex">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="text-sm text-muted transition-colors duration-200 hover:text-text"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>

      <div class="hidden items-center gap-4 md:flex">
        <button
          type="button"
          aria-label="Toggle theme"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors duration-200 hover:border-border-hover hover:text-text"
          @click="toggle"
        >
          <Sun v-if="theme === 'dark'" :size="16" />
          <Moon v-else :size="16" />
        </button>
        <a
          href="#"
          class="rounded-full bg-text px-4 py-2 text-sm text-bg transition-opacity duration-200 hover:opacity-90"
        >
          Join Community
        </a>
      </div>

      <div class="flex items-center gap-3 md:hidden">
        <button
          type="button"
          aria-label="Toggle theme"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted"
          @click="toggle"
        >
          <Sun v-if="theme === 'dark'" :size="16" />
          <Moon v-else :size="16" />
        </button>
        <button
          type="button"
          aria-label="Toggle menu"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text"
          @click="open = !open"
        >
          <X v-if="open" :size="16" />
          <Menu v-else :size="16" />
        </button>
      </div>
    </nav>

    <div v-if="open" class="border-t border-border px-6 py-4 md:hidden">
      <ul class="flex flex-col gap-4">
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            class="block text-sm text-muted transition-colors duration-200 hover:text-text"
            @click="closeMenu"
          >
            {{ link.label }}
          </a>
        </li>
        <li>
          <a
            href="#"
            class="block rounded-full bg-text px-4 py-2 text-center text-sm text-bg"
            @click="closeMenu"
          >
            Join Community
          </a>
        </li>
      </ul>
    </div>
  </header>
</template>
