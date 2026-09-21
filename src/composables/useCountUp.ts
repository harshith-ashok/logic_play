import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/**
 * Counts each value up from 0 the first time `root` scrolls into view.
 * Returns reactive display numbers (already final when reduced motion is on).
 */
export function useCountUp(root: Ref<HTMLElement | null>, targets: number[], duration = 1400) {
  const values = ref<number[]>(targets.map(() => 0));
  let io: IntersectionObserver | null = null;
  let raf = 0;

  function run() {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      values.value = targets.map((t) => Math.round(eased * t));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  onMounted(() => {
    if (!root.value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      values.value = [...targets];
      return;
    }
    io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io?.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    io.observe(root.value);
  });

  onBeforeUnmount(() => {
    io?.disconnect();
    cancelAnimationFrame(raf);
  });

  return values;
}
