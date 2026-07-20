import { onBeforeUnmount, onMounted, type Ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  start?: string;
}

export function useReveal(
  target: Ref<HTMLElement | null>,
  selector?: string,
  options: RevealOptions = {},
) {
  let ctx: gsap.Context | undefined;

  onMounted(() => {
    if (!target.value) return;
    ctx = gsap.context(() => {
      const els = selector
        ? target.value!.querySelectorAll(selector)
        : [target.value];
      if (!els || (els as NodeListOf<Element>).length === 0) return;

      gsap.set(els, { opacity: 0, y: options.y ?? 28 });
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.8,
        delay: options.delay ?? 0,
        stagger: options.stagger ?? 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: target.value,
          start: options.start ?? "top 82%",
          once: true,
        },
      });
    }, target.value);
  });

  onBeforeUnmount(() => ctx?.revert());
}
