import { onBeforeUnmount, onMounted, type Ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useCounter(
  target: Ref<HTMLElement | null>,
  value: number,
  options: { duration?: number; prefix?: string; suffix?: string } = {},
) {
  let ctx: gsap.Context | undefined;

  onMounted(() => {
    if (!target.value) return;
    ctx = gsap.context(() => {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: value,
        duration: options.duration ?? 1.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: target.value,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          if (!target.value) return;
          target.value.textContent = `${options.prefix ?? ""}${Math.round(counter.val)}${options.suffix ?? ""}`;
        },
      });
    }, target.value);
  });

  onBeforeUnmount(() => ctx?.revert());
}
