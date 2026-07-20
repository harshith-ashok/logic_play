import { ref, watchEffect } from "vue";

type Theme = "dark" | "light";

const theme = ref<Theme>(
  (document.documentElement.dataset.theme as Theme | undefined) ?? "dark",
);

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem("theme", theme.value);
});

export function useTheme() {
  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggle };
}
