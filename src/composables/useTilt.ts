import { onBeforeUnmount, onMounted, type Ref } from "vue";
import gsap from "gsap";

export function useTilt(target: Ref<HTMLElement | null>, strength = 6) {
  function handleMove(e: MouseEvent) {
    const el = target.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateX: -py * strength,
      rotateY: px * strength,
      duration: 0.4,
      ease: "power3.out",
      transformPerspective: 600,
    });
  }

  function handleLeave() {
    if (!target.value) return;
    gsap.to(target.value, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.6,
      ease: "power3.out",
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
