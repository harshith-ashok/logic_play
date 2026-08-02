import { ref, watchEffect } from "vue";

export type Theme = "dark" | "light";

const STORAGE_KEY = "logicplay-theme";
const THEME_COLOR: Record<Theme, string> = {
  dark: "#08090b",
  light: "#f5f5f4",
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
  localStorage.setItem(STORAGE_KEY, theme.value);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme.value]);
});

export function useTheme() {
  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }
  return { theme, toggle };
}
