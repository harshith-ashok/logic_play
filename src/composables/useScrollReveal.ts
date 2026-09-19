import { onMounted, onUnmounted, type Ref } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// Mobile browsers resize the viewport as the URL bar collapses; without this
// every such resize refreshes all triggers mid-scroll and causes visible jank.
ScrollTrigger.config({ ignoreMobileResize: true });

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const targets = selector
      ? root.value.querySelectorAll<HTMLElement>(selector)
      : root.value;

    const tween = gsap.fromTo(
      targets,
      { y: mobile ? Math.min(y, 16) : y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: mobile ? Math.min(duration, 0.45) : duration,
        delay,
        stagger: mobile ? Math.min(stagger, 0.05) : stagger,
        ease: "power3.out",
        force3D: true,
        clearProps: "transform,opacity",
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
