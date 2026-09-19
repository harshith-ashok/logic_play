<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../ui/Badge.vue";
import GridBar from "../ui/GridBar.vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import smallWhite from "../../assets/transparent/big_white.png";
import { useAuth } from "../../composables/useAuth";
import { useSiteSettings } from "../../composables/useSiteSettings";

const router = useRouter();
const route = useRoute();
const { user, profile, signOut } = useAuth();
const { settings } = useSiteSettings();

async function handleLogout() {
  await signOut();
  open.value = false;
  router.push("/");
}

// Press stays a real route (linked from the footer, and directly shareable)
// but is deliberately left out of primary nav — it's a reference page, not
// a destination visitors need one click away.
const links = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/events", label: "Events" },
  { to: "/blog", label: "Blog" },
  { to: "/team", label: "Team" },
];

const open = ref(false);

// "/" only matches exactly; everything else also matches its sub-pages
// (so /blog/some-post keeps "Blog" lit).
const isActive = (to: string) =>
  to === "/" ? route.path === "/" : route.path === to || route.path.startsWith(`${to}/`);
const pad = (n: number) => String(n).padStart(2, "0");
</script>

<template>
  <header class="glass-surface fixed inset-x-0 top-0 z-50 overflow-hidden">
    <GridBar />
    <nav class="flex h-14 items-stretch justify-between px-4 sm:px-6">
      <router-link to="/" class="flex items-center" aria-label="Logic Play home" @click="open = false">
        <img :src="smallWhite" alt="Logic Play" class="brand-mark h-7 w-auto" />
      </router-link>

      <ul class="hidden items-stretch md:flex">
        <li v-for="(link, i) in links" :key="link.to" class="flex">
          <router-link
            :to="link.to"
            class="group relative flex items-center gap-2 px-5 font-display text-xs uppercase tracking-tight transition-colors duration-200"
            :class="isActive(link.to) ? 'text-fg' : 'text-fg-muted hover:text-fg'"
          >
            <span class="text-[10px] text-fg-subtle">{{ pad(i + 1) }}</span>
            {{ link.label }}
            <span
              class="absolute inset-x-5 bottom-0 h-px origin-left bg-accent transition-transform duration-300"
              :class="isActive(link.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
              :style="{ transitionTimingFunction: 'var(--ease-mechanical)' }"
            />
          </router-link>
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <ThemeToggle />

        <div class="hidden items-center gap-2 md:flex">
          <Badge :href="settings?.join_link" tone="solid" size="sm" interactive arrow>Join</Badge>
          <button v-if="user" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="handleLogout">
            <Badge as="span" size="sm" interactive>Log out</Badge>
          </button>
        </div>

        <!-- Far-right account icon: profile when signed in, login otherwise. -->
        <router-link
          :to="user ? '/account' : '/login'"
          :title="user ? (profile?.username ?? 'Account') : 'Log in'"
          :aria-label="user ? `Account (${profile?.username ?? ''})` : 'Log in'"
          class="glass-surface relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm text-fg transition-colors duration-200 hover:bg-glass-hover"
          :class="route.path === '/account' && 'border-accent!'"
          @click="open = false"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
        </router-link>

        <button
          type="button"
          class="flex h-9 w-9 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 border border-border bg-transparent md:hidden"
          :aria-expanded="open"
          aria-label="Toggle menu"
          @click="open = !open"
        >
          <span class="h-px w-5 bg-fg transition-transform duration-200" :class="open && 'translate-y-[3.5px] rotate-45'" />
          <span class="h-px w-5 bg-fg transition-transform duration-200" :class="open && '-translate-y-[3.5px] -rotate-45'" />
        </button>
      </div>
    </nav>

    <div v-if="open" class="border-t border-border md:hidden">
      <ul class="flex flex-col">
        <li v-for="(link, i) in links" :key="link.to" class="border-b border-border">
          <router-link
            :to="link.to"
            class="flex items-baseline gap-3 px-4 py-4 font-display text-lg uppercase tracking-tight sm:px-6"
            :class="isActive(link.to) ? 'text-fg' : 'text-fg-muted'"
            @click="open = false"
          >
            <span class="text-xs text-fg-subtle">{{ pad(i + 1) }}</span>
            {{ link.label }}
          </router-link>
        </li>
      </ul>
      <div class="flex flex-wrap gap-2 p-4 sm:px-6">
        <button v-if="user" type="button" class="cursor-pointer border-none bg-transparent p-0" @click="handleLogout">
          <Badge as="span" size="sm" interactive>Log out</Badge>
        </button>
        <Badge :href="settings?.join_link" tone="solid" size="sm" interactive arrow>Join the Club</Badge>
      </div>
    </div>
  </header>
</template>
