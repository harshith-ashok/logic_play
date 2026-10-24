<script setup lang="ts">
import { onMounted, ref } from "vue";

// Old-TV static: one 180px noise tile, generated once, jittered in steps by CSS.
const el = ref<HTMLElement | null>(null);

onMounted(() => {
  const c = document.createElement("canvas");
  c.width = c.height = 180;
  const x = c.getContext("2d")!;
  const d = x.createImageData(180, 180);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  if (el.value) el.value.style.backgroundImage = `url(${c.toDataURL()})`;
});
</script>

<template>
  <div ref="el" class="tv-static" aria-hidden="true" />
</template>
