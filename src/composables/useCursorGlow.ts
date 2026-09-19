import { onMounted, onUnmounted } from "vue";

const GLOW_SELECTOR = ".glass-surface, .cursor-glow-bg";

/**
 * Single delegated pointermove listener that drives the cursor-tracked
 * gradient on every `.glass-surface` / `.cursor-glow-bg` element (see
 * style.css). Delegated on `document` so it works for any glow element
 * anywhere, present now or added later, without per-component wiring.
 */
export function useCursorGlow() {
  function handlePointerMove(e: PointerEvent) {
    if (e.pointerType !== "mouse") return; // no hover on touch — skip the layout reads
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(GLOW_SELECTOR);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    target.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  onMounted(() => document.addEventListener("pointermove", handlePointerMove, { passive: true }));
  onUnmounted(() => document.removeEventListener("pointermove", handlePointerMove));
}
