import { onMounted, onUnmounted, type Ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealOptions {
  /** CSS selector (relative to the root element) for items to stagger in. Defaults to the root itself. */
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
}

/**
 * Punch-in scroll entrance: elements snap up into place with a sharp,
 * mechanical ease rather than a springy/bouncy default.
 */
export function useScrollReveal(
  root: Ref<HTMLElement | null>,
  options: RevealOptions = {},
) {
  const { selector, y = 32, stagger = 0.08, duration = 0.6, delay = 0 } = options;
  let triggers: ScrollTrigger[] = [];

  onMounted(() => {
    if (!root.value) return;
    const targets = selector
      ? root.value.querySelectorAll<HTMLElement>(selector)
      : root.value;

    const tween = gsap.fromTo(
      targets,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.value,
          start: "top 85%",
          once: true,
        },
      },
    );

    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  });

  onUnmounted(() => {
    triggers.forEach((trigger) => trigger.kill());
    triggers = [];
  });
}
