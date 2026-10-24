<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { C, drawBand } from "../../lib/landing/draw";

const props = defineProps<{ from: "ink" | "paper"; to: "ink" | "paper" }>();
const cv = ref<HTMLCanvasElement | null>(null);

const paint = () => cv.value && drawBand(cv.value, C[props.from], C[props.to]);
let t = 0;
const onResize = () => {
  clearTimeout(t);
  t = window.setTimeout(paint, 120);
};
onMounted(() => {
  paint();
  addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  removeEventListener("resize", onResize);
  clearTimeout(t);
});
</script>

<template>
  <canvas ref="cv" class="band" aria-hidden="true" />
</template>
