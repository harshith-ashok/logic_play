import { onMounted, onUnmounted, type Ref } from "vue";

interface RevealOptions {
  /** CSS selector (relative to the root element) for items to reveal. Defaults to the root itself. */
  selector?: string;
  /** Seconds of delay between neighbours (cycled every 4 items so long grids never lag). */
  stagger?: number;
}

const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// One observer for the whole app. Each element gets `.rv` (hidden, offset) on
// mount and `.rv-in` when it scrolls into view; both classes are removed once
// the transition is done so the element goes back to plain, un-animated CSS
// (hover transforms etc. aren't fought by a leftover reveal state).
let observer: IntersectionObserver | null = null;

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer!.unobserve(el);
        el.classList.add("rv-in");
        window.setTimeout(() => {
          el.classList.remove("rv", "rv-in");
          el.style.removeProperty("--d");
        }, 1100);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  return observer;
}

/**
 * Scroll-triggered entrance: elements fade/slide up once, using CSS
 * transitions and a single shared IntersectionObserver (no animation library,
 * no scroll listeners).
 */
export function useScrollReveal(root: Ref<HTMLElement | null>, options: RevealOptions = {}) {
  const { selector, stagger = 0.06 } = options;
  let targets: HTMLElement[] = [];

  onMounted(() => {
    if (!root.value || REDUCED()) return;
    targets = selector ? Array.from(root.value.querySelectorAll<HTMLElement>(selector)) : [root.value];
    const io = getObserver();
    targets.forEach((el, i) => {
      el.style.setProperty("--d", `${(i % 4) * stagger}s`);
      el.classList.add("rv");
      io.observe(el);
    });
  });

  onUnmounted(() => {
    targets.forEach((el) => observer?.unobserve(el));
    targets = [];
  });
}
