<script setup lang="ts">
import { ref } from "vue";
import TheNavbar from "./components/layout/TheNavbar.vue";
import TheFooter from "./components/layout/TheFooter.vue";
import AppLoader from "./components/ui/AppLoader.vue";
import CursorFx from "./components/ui/CursorFx.vue";

// Branding moment once per tab session; never on later visits or reloads
// within it. Purely visual — doesn't gate routing or data.
const seen = (() => {
  try {
    return sessionStorage.getItem("lp-loaded") === "1";
  } catch {
    return false;
  }
})();
const loading = ref(!seen);
function onLoaded() {
  loading.value = false;
  try {
    sessionStorage.setItem("lp-loaded", "1");
  } catch {
    /* ignore */
  }
}

// A handful of static pulsing circuit nodes over the grid (delays staggered).
const nodes = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 173 + 40) % 1180}px`,
  top: `${((i * 97) % 5) * 90 + 30}px`,
  delay: `${(i % 7) * 0.4}s`,
}));
</script>

<template>
  <CursorFx />
  <div class="grid-bg" aria-hidden="true">
    <span
      v-for="(n, i) in nodes"
      :key="i"
      class="node hidden sm:block"
      :style="{ left: n.left, top: n.top, animationDelay: n.delay }"
    />
  </div>
  <AppLoader v-if="loading" @done="onLoaded" />
  <div class="relative z-10 flex min-h-svh flex-col text-fg">
    <TheNavbar />
    <main class="flex-1 pt-16">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <TheFooter />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s linear;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
