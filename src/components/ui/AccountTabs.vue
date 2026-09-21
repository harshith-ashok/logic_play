<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../../composables/useAuth";

// Tab strip shared by every signed-in page (profile, posts, leaderboard, …).
// These are real routes, so each tab is a link rather than in-page state.
const { profile } = useAuth();
const route = useRoute();

const tabs = computed(() => {
  const role = profile.value?.role;
  return [
    { to: "/account", label: "Profile" },
    ...(role === "core_team" ? [{ to: "/admin", label: "Admin" }] : []),
    ...(role && role !== "volunteer"
      ? [
          { to: "/blog/dashboard", label: "My posts" },
          { to: "/leaderboard", label: "Leaderboard" },
        ]
      : []),
    { to: "/events-attended", label: "Events attended" },
  ];
});
</script>

<template>
  <nav class="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="Account">
    <router-link
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="min-h-10 shrink-0 border px-4 py-2.5 font-mono text-xs font-semibold tracking-wide whitespace-nowrap uppercase transition-[border-color,color,background-color,translate] duration-200 hover:-translate-y-0.5"
      :class="
        route.path === t.to
          ? 'border-fg bg-fg text-bg'
          : 'border-border text-fg-muted hover:border-fg-muted hover:text-fg'
      "
    >
      {{ t.label }}
    </router-link>
  </nav>
</template>
