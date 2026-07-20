import { onBeforeUnmount, onMounted, type Ref } from "vue";
import gsap from "gsap";

export function useMagnetic(target: Ref<HTMLElement | null>, strength = 0.35) {
  function handleMove(e: MouseEvent) {
    const el = target.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: x * strength,
      y: y * strength,
      duration: 0.4,
      ease: "power3.out",
    });
  }

  function handleLeave() {
    if (!target.value) return;
    gsap.to(target.value, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: "elastic.out(1, 0.4)",
    });
  }

  onMounted(() => {
    target.value?.addEventListener("mousemove", handleMove);
    target.value?.addEventListener("mouseleave", handleLeave);
  });

  onBeforeUnmount(() => {
    target.value?.removeEventListener("mousemove", handleMove);
    target.value?.removeEventListener("mouseleave", handleLeave);
  });
}
