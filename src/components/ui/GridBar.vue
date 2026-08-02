<script setup lang="ts">
withDefaults(defineProps<{ marks?: number }>(), { marks: 16 });
</script>

<template>
  <div class="h-6 w-full border-b border-border" aria-hidden="true">
    <div class="flex h-full items-center justify-between px-4 sm:px-6">
      <span
        v-for="n in marks"
        :key="n"
        class="select-none font-sans text-xs leading-none text-fg-subtle"
        >+</span
      >
    </div>
  </div>
</template>
