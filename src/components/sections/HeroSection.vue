<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import gsap from "gsap";
import GridBackground from "@/components/ui/GridBackground.vue";
import TerminalCard from "@/components/ui/TerminalCard.vue";
import MagneticButton from "@/components/ui/MagneticButton.vue";
import { appReady } from "@/composables/useAppReady";

const section = ref<HTMLElement | null>(null);
const copy = ref<HTMLElement | null>(null);
const terminal = ref<HTMLElement | null>(null);

const moveCopy = ref<gsap.QuickToFunc>();
const moveTerminal = ref<gsap.QuickToFunc>();

function handleMove(e: MouseEvent) {
  if (!section.value) return;
  const rect = section.value.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width - 0.5;
  const py = (e.clientY - rect.top) / rect.height - 0.5;
  moveCopy.value?.(px * -10, py * -10);
  moveTerminal.value?.(px * 16, py * 16);
}

let ctx: gsap.Context | undefined;

onMounted(() => {
  if (!section.value) return;
  ctx = gsap.context(() => {
    function playIntro() {
      gsap.timeline({ defaults: { ease: "power3.out" } }).from(".hero-reveal", {
        opacity: 0,
        y: 32,
        stagger: 0.12,
        duration: 0.9,
      });
    }

    if (appReady.value) {
      playIntro();
    } else {
      const stop = watch(appReady, (ready) => {
        if (!ready) return;
        playIntro();
        stop();
      });
    }

    if (copy.value) {
      moveCopy.value = gsap.quickTo(copy.value, "x", { duration: 0.6, ease: "power3.out" });
    }
    if (terminal.value) {
      moveTerminal.value = gsap.quickTo(terminal.value, "y", { duration: 0.6, ease: "power3.out" });
    }
  }, section.value);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <section
    ref="section"
    class="relative flex min-h-screen items-center overflow-hidden pt-16"
    @mousemove="handleMove"
  >
    <GridBackground />

    <div class="relative mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div ref="copy">
        <p class="hero-reveal text-xs uppercase tracking-[0.2em] text-accent-blue">
          Logic Play Technical Club
        </p>
        <h1 class="hero-reveal mt-6 text-6xl font-medium tracking-tight text-text sm:text-7xl">
          Logic Play
        </h1>
        <p class="hero-reveal mt-6 max-w-md text-lg text-muted">
          Build. Break. Learn. Repeat.
        </p>
        <div class="hero-reveal mt-10 flex flex-wrap items-center gap-4">
          <MagneticButton href="#" variant="primary">Join Community</MagneticButton>
          <MagneticButton href="#projects" variant="secondary">Explore Projects</MagneticButton>
        </div>
      </div>

      <div ref="terminal" class="hero-reveal flex justify-center lg:justify-end">
        <TerminalCard />
      </div>
    </div>
  </section>
</template>
