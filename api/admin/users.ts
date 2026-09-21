import { requireCaller, type Role } from "../_lib/auth.js";
import { handle, HttpError, json, readJson, requireEnv } from "../_lib/http.js";

// Core-team user management. Uses the Supabase service-role key (server-side
// only) because deleting an auth user can't be done with the publishable key.
// Every handler re-checks the caller's role first.
//   GET    /api/admin/users                    -> list profiles
//   PATCH  /api/admin/users { id, role }       -> change a role
//   DELETE /api/admin/users { id }             -> delete the account

const ROLES: Role[] = ["core_team", "member", "volunteer"];
const UUID = /^[0-9a-f-]{36}$/i;

function service() {
  const url = process.env.SUPABASE_URL ?? requireEnv("VITE_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  // New-style sb_secret_ keys aren't JWTs, so they go in `apikey` only.
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  return { url, headers };
}

async function fail(res: Response, message: string): Promise<never> {
  console.error("Supabase admin error", res.status, res.url, await res.text().catch(() => ""));
  throw new HttpError(502, `${message} (Supabase ${res.status})`);
}

async function coreTeamCount(): Promise<number> {
  const { url, headers } = service();
  const res = await fetch(`${url}/rest/v1/profiles?role=eq.core_team&select=id`, { headers });
  if (!res.ok) await fail(res, "Could not read users.");
  return ((await res.json()) as unknown[]).length;
}

async function targetRole(id: string): Promise<Role> {
  const { url, headers } = service();
  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${id}&select=role`, { headers });
  const [row] = res.ok ? ((await res.json()) as { role: Role }[]) : [];
  if (!row) throw new HttpError(404, "User not found.");
  return row.role;
}

export function GET(request: Request) {
  return handle(async () => {
    await requireCaller(request, ["core_team"]);
    const { url, headers } = service();
    const res = await fetch(
      `${url}/rest/v1/profiles?select=id,username,first_name,last_name,registration_number,github_username,role,created_at&order=created_at.desc`,
      { headers },
    );
    if (!res.ok) await fail(res, "Could not read users.");
    return json(await res.json());
  });
}

export function PATCH(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team"]);
    const { id = "", role } = await readJson<{ id?: string; role?: Role }>(request);
    if (!UUID.test(id)) throw new HttpError(400, "Invalid user.");
    if (!role || !ROLES.includes(role)) throw new HttpError(400, "Unknown role.");
    if (id === caller.id) throw new HttpError(400, "You can't change your own role.");

    const current = await targetRole(id);
    if (current === "core_team" && role !== "core_team" && (await coreTeamCount()) <= 1) {
      throw new HttpError(409, "There must be at least one core team member.");
    }

    const { url, headers } = service();
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) await fail(res, "Could not update the role.");
    return json({ id, role });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const caller = await requireCaller(request, ["core_team"]);
    const { id = "" } = await readJson<{ id?: string }>(request);
    if (!UUID.test(id)) throw new HttpError(400, "Invalid user.");
    if (id === caller.id) throw new HttpError(400, "You can't delete your own account here.");

    if ((await targetRole(id)) === "core_team" && (await coreTeamCount()) <= 1) {
      throw new HttpError(409, "There must be at least one core team member.");
    }

    const { url, headers } = service();
    const res = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: "DELETE", headers });
    if (!res.ok) await fail(res, "Could not delete the user.");
    // Covers the case where profiles doesn't cascade from auth.users.
    await fetch(`${url}/rest/v1/profiles?id=eq.${id}`, { method: "DELETE", headers });
    return json({ id });
  });
}
