<script setup lang="ts">
withDefaults(defineProps<{ words?: string[]; duration?: number }>(), {
  words: () => ["Build", "Ship", "Repeat"],
  duration: 22,
});
</script>

<template>
  <div class="group overflow-hidden border-y border-border bg-bg-elevated py-3.5" aria-hidden="true">
    <div
      class="flex w-max gap-10 font-mono text-[13px] tracking-widest text-fg-muted uppercase group-hover:[animation-play-state:paused]"
      :style="{ animation: `marqueeScroll ${duration}s linear infinite` }"
    >
      <!-- Two identical halves; the keyframes shift by -50% for a seamless loop. -->
      <span v-for="half in 2" :key="half" class="flex items-center gap-10 whitespace-nowrap">
        <template v-for="n in 5" :key="n">
          <template v-for="w in words" :key="w">
            {{ w }} <em class="text-accent not-italic">//</em>
          </template>
        </template>
      </span>
    </div>
  </div>
</template>
