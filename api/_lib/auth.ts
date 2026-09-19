import { HttpError, requireEnv } from "./http.js";

export type Role = "core_team" | "member" | "volunteer";

export interface Caller {
  id: string;
  username: string;
  role: Role;
}

// Verifies the Supabase access token the browser sends and reads the role from
// the profiles table *as that user* (RLS applies), so a client can't claim a
// role it doesn't have. Returns null for anonymous requests.
export async function getCaller(request: Request): Promise<Caller | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.SUPABASE_URL ?? requireEnv("VITE_SUPABASE_URL");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  const headers = { apikey: key, Authorization: `Bearer ${token}` };

  const userRes = await fetch(`${url}/auth/v1/user`, { headers });
  if (!userRes.ok) return null;
  const { id } = (await userRes.json()) as { id: string };

  const profileRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=username,role`,
    { headers },
  );
  if (!profileRes.ok) return null;
  const [profile] = (await profileRes.json()) as { username: string; role: Role }[];
  return profile ? { id, username: profile.username, role: profile.role } : null;
}

export async function requireCaller(request: Request, roles: Role[]): Promise<Caller> {
  const caller = await getCaller(request);
  if (!caller) throw new HttpError(401, "Log in to continue.");
  if (!roles.includes(caller.role)) throw new HttpError(403, "You don't have access to this.");
  return caller;
}
