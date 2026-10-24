import type { Directive } from "vue";

// Slides a heading into place the first time it scrolls into view.
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.2 },
);

export const vSettle: Directive<HTMLElement> = {
  mounted: (el) => io.observe(el),
  unmounted: (el) => io.unobserve(el),
};
