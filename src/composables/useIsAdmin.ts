import { computed } from "vue";
import { useAuth } from "./useAuth";

/** True for core_team. UI-only gate: RLS is what actually enforces it. */
export function useIsAdmin() {
  const { profile } = useAuth();
  return computed(() => profile.value?.role === "core_team");
}
