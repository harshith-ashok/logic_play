<script setup lang="ts">
import { ref } from "vue";
import TheNavbar from "./components/layout/TheNavbar.vue";
import TheFooter from "./components/layout/TheFooter.vue";
import AppLoader from "./components/ui/AppLoader.vue";
import { useCursorGlow } from "./composables/useCursorGlow";

useCursorGlow();

const loading = ref(true);
</script>

<template>
  <AppLoader v-if="loading" @done="loading = false" />
  <div class="relative flex min-h-screen flex-col bg-bg text-fg">
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
  transition: opacity 0.2s var(--ease-mechanical);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
