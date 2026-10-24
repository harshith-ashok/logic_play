<script setup lang="ts">
import { ref } from "vue";
import TheNavbar from "./components/layout/TheNavbar.vue";
import TheFooter from "./components/layout/TheFooter.vue";
import AppLoader from "./components/ui/AppLoader.vue";
import CursorFx from "./components/ui/CursorFx.vue";
import TvStatic from "./components/ui/TvStatic.vue";

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

</script>

<template>
  <CursorFx />
  <TvStatic />
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
