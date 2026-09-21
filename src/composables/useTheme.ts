import { ref, watchEffect } from "vue";

export type Theme = "dark" | "light";

const STORAGE_KEY = "logicplay-theme";
const THEME_COLOR: Record<Theme, string> = {
  dark: "#0a0908",
  light: "#f2efe9",
};

// Module-level singleton so every component sees the same theme state
// without needing Pinia. `index.html` sets the initial `data-theme`
// attribute synchronously (before paint) — this just reads it back and
// takes over for subsequent toggles.
const theme = ref<Theme>(
  (document.documentElement.getAttribute("data-theme") as Theme | null) ?? "dark",
);

watchEffect(() => {
  document.documentElement.setAttribute("data-theme", theme.value);
  try {
    localStorage.setItem(STORAGE_KEY, theme.value);
  } catch {
    /* storage unavailable (private mode) — theme still applies this session */
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme.value]);
});

let themingTimer: number | undefined;

export function useTheme() {
  function toggle() {
    // Crossfade colors only for the duration of the switch (see `.theming` in style.css).
    const root = document.documentElement;
    root.classList.add("theming");
    window.clearTimeout(themingTimer);
    themingTimer = window.setTimeout(() => root.classList.remove("theming"), 450);
    theme.value = theme.value === "dark" ? "light" : "dark";
  }
  return { theme, toggle };
}
