<script setup lang="ts">
import AccountTabs from "../components/ui/AccountTabs.vue";
</script>

<template>
  <div class="wrap py-10 md:py-16">
    <div class="mx-auto max-w-3xl">
      <AccountTabs />
      <h1 class="page-title">Events attended</h1>
      <p class="page-sub mb-10">Your RSVPs and attendance history.</p>
      <div class="empty-state">Attendance tracking is coming in a later phase.</div>
    </div>
  </div>
</template>
