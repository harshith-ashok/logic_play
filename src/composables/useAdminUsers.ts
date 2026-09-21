import { ref } from "vue";
import { useAuth, type Profile, type UserRole } from "./useAuth";

export type AdminUser = Pick<
  Profile,
  "id" | "username" | "first_name" | "last_name" | "registration_number" | "github_username" | "role" | "created_at"
>;

async function request<T>(init: RequestInit = {}): Promise<T> {
  const { session } = useAuth();
  const headers = new Headers(init.headers);
  const token = session.value?.access_token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const res = await fetch("/api/admin/users", { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

/** Core-team user management, backed by /api/admin/users. */
export function useAdminUsers() {
  const users = ref<AdminUser[]>([]);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      users.value = await request<AdminUser[]>();
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    } finally {
      loading.value = false;
    }
  }

  async function setRole(id: string, role: UserRole) {
    try {
      await request({ method: "PATCH", body: JSON.stringify({ id, role }) });
      const u = users.value.find((x) => x.id === id);
      if (u) u.role = role;
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async function remove(id: string) {
    try {
      await request({ method: "DELETE", body: JSON.stringify({ id }) });
      users.value = users.value.filter((x) => x.id !== id);
      return { error: null };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  return { users, loading, load, setRole, remove };
}
