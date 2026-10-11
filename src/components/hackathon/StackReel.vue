<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

// One slot-machine column: cycles through the layer's option names, slowing
// down, then lands on the team's assigned option. Purely visual: `final` comes
// from the server and is already decided.
const props = defineProps<{
  layer: string;
  pool: string[];
  final: string;
  /** Flip to true to start spinning. */
  run: boolean;
  /** How long to spin before landing, ms. */
  spinMs: number;
  /** Show the result immediately, no spin (a team coming back to its result). */
  instant?: boolean;
}>();
const emit = defineEmits<{ landed: [] }>();

const shown = ref("");
const landed = ref(false);
let timer: number | undefined;

const names = computed(() => (props.pool.length > 1 ? props.pool : [...props.pool, props.final, "—"]));

function land() {
  shown.value = props.final;
  landed.value = true;
  emit("landed");
}

function start() {
  landed.value = false;
  if (props.instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return land();

  const t0 = performance.now();
  const tick = () => {
    const progress = (performance.now() - t0) / props.spinMs;
    if (progress >= 1) return land();
    let next = shown.value;
    // never repeat the same name twice in a row
    while (next === shown.value) next = names.value[Math.floor(Math.random() * names.value.length)];
    shown.value = next;
    // fast at first, easing out to a crawl just before landing
    timer = window.setTimeout(tick, 55 + progress ** 3 * 320);
  };
  tick();
}

watch(
  () => props.run,
  (run) => run && start(),
  { immediate: true },
);
onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<template>
  <div
    class="glass-surface relative flex min-h-36 flex-col justify-between overflow-hidden p-5 transition-[border-color,box-shadow] duration-500"
    :class="landed ? 'border-accent! shadow-[0_0_40px_-8px_var(--color-accent)]' : ''"
  >
    <span class="label">{{ layer }}</span>
    <!-- Name is announced once, by the parent's live region, not on every tick. -->
    <span
      :key="shown"
      class="reel-name mt-6 block break-words font-display text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl"
      :class="landed ? 'text-fg' : 'text-fg-subtle'"
      aria-hidden="true"
    >
      {{ run ? shown : "?" }}
    </span>
    <span class="sr-only">{{ landed ? `${layer}: ${final}` : "" }}</span>
  </div>
</template>

<style scoped>
.reel-name {
  animation: reel-in 90ms linear;
}
@keyframes reel-in {
  from {
    transform: translateY(-35%);
    opacity: 0.2;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reel-name {
    animation: none;
  }
}
</style>
