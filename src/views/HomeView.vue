<script setup lang="ts">
import { computed } from "vue";
import "../styles/landing.css";
import HalftoneBand from "../components/landing/HalftoneBand.vue";
import LandingEngine from "../components/landing/LandingEngine.vue";
import LandingFocus from "../components/landing/LandingFocus.vue";
import LandingHero from "../components/landing/LandingHero.vue";
import LandingJoin from "../components/landing/LandingJoin.vue";
import LandingLoop from "../components/landing/LandingLoop.vue";
import LandingManifesto from "../components/landing/LandingManifesto.vue";
import LandingTapes from "../components/landing/LandingTapes.vue";
import LandingTeam from "../components/landing/LandingTeam.vue";
import { useSiteSettings } from "../composables/useSiteSettings";

const { settings } = useSiteSettings();
const announcement = computed(() =>
  settings.value?.announcement_text
    ? { text: settings.value.announcement_text, link: settings.value.announcement_link }
    : null,
);
</script>

<template>
  <div class="lp">
    <LandingHero :announcement="announcement" :join-link="settings?.join_link" />
    <LandingManifesto />
    <HalftoneBand from="paper" to="ink" />
    <LandingLoop />
    <HalftoneBand from="ink" to="paper" />
    <LandingFocus />
    <HalftoneBand from="paper" to="ink" />
    <LandingEngine />
    <LandingTapes />
    <HalftoneBand from="ink" to="paper" />
    <LandingTeam />
    <HalftoneBand from="paper" to="ink" />
    <LandingJoin :join-link="settings?.join_link" />
  </div>
</template>
