<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Badge from "../ui/Badge.vue";
import ThemeToggle from "../ui/ThemeToggle.vue";
import LogoMark from "../ui/LogoMark.vue";
import { useAuth } from "../../composables/useAuth";

const router = useRouter();
const route = useRoute();
const { user, profile, signOut } = useAuth();

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
const accountActive = computed(() =>
  ["/account", "/admin", "/leaderboard", "/events-attended", "/blog/dashboard"].includes(route.path),
);

async function handleLogout() {
  await signOut();
  open.value = false;
  router.push("/");
}

// Full-screen mobile menu: lock page scroll while it's open, close on route
// change or Escape.
watch(open, (isOpen) => {
  document.documentElement.style.overflow = isOpen ? "hidden" : "";
});
watch(() => route.fullPath, () => (open.value = false));
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener("keydown", onKey);
  else document.removeEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 border-b border-border bg-bg"
    style="animation: headerDrop 0.6s var(--ease-mechanical) 0.1s backwards"
  >
    <nav class="wrap flex h-16 items-center justify-between gap-3">
      <router-link
        to="/"
        class="flex items-center gap-3.5 py-1.5"
        aria-label="Logic Play home"
      >
        <LogoMark class="block h-8 w-auto" />
        <b class="font-display text-[15px] tracking-[0.02em]">Logic Play</b>
      </router-link>

      <ul class="hidden items-center gap-7 md:flex">
        <li v-for="link in links" :key="link.to">
          <router-link
            :to="link.to"
            class="mono group relative py-1.5 transition-colors duration-200"
            :class="isActive(link.to) ? 'text-fg' : 'text-fg-muted hover:text-fg'"
          >
            {{ link.label }}
            <span
              class="absolute inset-x-0 bottom-0 h-[1.5px] origin-right bg-current transition-transform duration-500"
              :class="isActive(link.to) ? 'scale-x-100' : 'scale-x-0 group-hover:origin-left group-hover:scale-x-100'"
            />
          </router-link>
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <ThemeToggle />
        <Badge
          to="/join"
          tone="solid"
          size="sm"
          interactive
          arrow
          class="magnetic hidden sm:inline-flex"
        >
          Join the club
        </Badge>
        <router-link
          :to="user ? '/account' : '/login'"
          :title="user ? (profile?.username ?? 'Account') : 'Log in'"
          :aria-label="user ? `Account (${profile?.username ?? ''})` : 'Log in'"
          class="grid h-10 w-10 shrink-0 place-items-center border bg-transparent text-fg-muted transition-[border-color,color] duration-200 hover:border-fg-muted hover:text-fg sm:h-9 sm:w-9"
          :class="accountActive ? 'border-accent text-fg' : 'border-border'"
        >
          <svg viewBox="0 0 24 24" class="h-[15px] w-[15px]" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </router-link>
        <button
          type="button"
          class="grid h-10 w-10 shrink-0 cursor-pointer place-items-center border border-border bg-transparent text-fg md:hidden"
          :aria-expanded="open"
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
          @click="open = !open"
        >
          <svg viewBox="0 0 24 24" class="h-[15px] w-[15px]" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path v-if="!open" d="M3 6h18M3 12h18M3 18h18" />
            <path v-else d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </nav>

    <Transition name="menu">
      <div
        v-if="open"
        id="mobile-menu"
        class="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-border bg-bg md:hidden"
      >
        <ul class="wrap flex flex-col pt-2">
          <li v-for="link in links" :key="link.to" class="border-b border-border">
            <router-link
              :to="link.to"
              class="font-display flex items-baseline gap-3 py-5 text-3xl"
              :class="isActive(link.to) ? 'text-fg' : 'text-fg-muted'"
            >
              {{ link.label }}
            </router-link>
          </li>
        </ul>
        <div class="wrap flex flex-col gap-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Badge to="/join" tone="solid" size="lg" interactive arrow class="w-full">Join the club</Badge>
          <button v-if="user" type="button" class="w-full cursor-pointer border-none bg-transparent p-0" @click="handleLogout">
            <Badge as="span" size="lg" interactive class="w-full">Log out</Badge>
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 0.25s var(--ease-mechanical),
    transform 0.25s var(--ease-mechanical);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}
</style>
