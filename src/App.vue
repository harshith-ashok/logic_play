<script setup lang="ts">
import AppLoader from "@/components/ui/AppLoader.vue";
import TheNavbar from "@/components/layout/TheNavbar.vue";
import TheFooter from "@/components/layout/TheFooter.vue";
import HeroSection from "@/components/sections/HeroSection.vue";
import AboutSection from "@/components/sections/AboutSection.vue";
import DomainsSection from "@/components/sections/DomainsSection.vue";
import ProjectsSection from "@/components/sections/ProjectsSection.vue";
import TimelineSection from "@/components/sections/TimelineSection.vue";
import StatsSection from "@/components/sections/StatsSection.vue";
import TeamSection from "@/components/sections/TeamSection.vue";
</script>

<template>
  <div class="min-h-screen bg-bg text-text">
    <AppLoader />
    <TheNavbar />
    <main>
      <HeroSection />
      <AboutSection />
      <DomainsSection />
      <ProjectsSection />
      <TimelineSection />
      <StatsSection />
      <TeamSection />
    </main>
    <TheFooter />
  </div>
</template>
