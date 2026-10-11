// The ONLY place hackathon code talks to Supabase. Pages and composables call
// these functions; each one resolves with data or throws an Error whose
// message is safe to show (RPC `raise exception` text, or the PostgREST message).
import { getSupabase } from "../supabase";
import type {
  Hackathon,
  HackathonSettings,
  Problem,
  RegistrationResult,
  RegistrationStatus,
  TeamResult,
  RosterRow,
  TechOption,
} from "./types";

function db() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase isn't configured (missing VITE_SUPABASE_* env vars).");
  return client;
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

function check(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
}

// ---------- public (anon-callable RPCs) ----------

/** `null` when no hackathon has this slug. */
export async function getRegistrationStatus(slug: string): Promise<RegistrationStatus | null> {
  return unwrap(await db().rpc("hackathon_registration_status", { p_slug: slug }));
}

/** Slug + name of the newest hackathon, or `null` when none exist. */
export async function getLatestHackathon(): Promise<{ slug: string; name: string } | null> {
  return unwrap(await db().rpc("hackathon_latest"));
}

/** Throws "No team matches…" unless the code and the leader's reg number both match. */
export async function getTeamResult(slug: string, code: string, leaderReg: string): Promise<TeamResult> {
  return unwrap(
    await db().rpc("hackathon_team_result", { p_slug: slug, p_code: code, p_leader_reg: leaderReg }),
  );
}

/**

 * The team's pick. The first call deals the stack; picking a different problem
 * later (limited by `max_problem_changes`) re-deals it too. Server-enforced. Resolves with the team's new state.
 */
export async function chooseProblem(
  slug: string,
  code: string,
  leaderReg: string,
  problemId: number,
): Promise<TeamResult> {
  return unwrap(
    await db().rpc("hackathon_choose_problem", {
      p_slug: slug,
      p_code: code,
      p_leader_reg: leaderReg,
      p_problem_id: problemId,
    }),
  );
}

/** Re-rolls only the stack (problem kept). Limited per team by the hackathon's `max_stack_rerolls`. */
export async function rerollStack(slug: string, code: string, leaderReg: string): Promise<TeamResult> {
  return unwrap(
    await db().rpc("hackathon_reroll_stack", { p_slug: slug, p_code: code, p_leader_reg: leaderReg }),
  );
}

export async function registerTeam(
  slug: string,
  teamName: string,
  leader: Record<string, unknown>,
  members: Record<string, unknown>[],
): Promise<RegistrationResult> {
  return unwrap(
    await db().rpc("hackathon_register_team", {
      p_slug: slug,
      p_team_name: teamName,
      p_leader: leader,
      p_members: members,
    }),
  );
}

// ---------- admin (RLS: core_team only) ----------

export async function listHackathons(): Promise<Hackathon[]> {
  return unwrap(await db().from("hackathons").select("*").order("created_at", { ascending: false }));
}

export async function getHackathon(slug: string): Promise<Hackathon | null> {
  return unwrap(await db().from("hackathons").select("*").eq("slug", slug).maybeSingle());
}

/** Returns the new hackathon's id. `copyFrom` clones layers, limits, options and problems. */
export async function createHackathon(slug: string, name: string, copyFrom: string | null): Promise<string> {
  return unwrap(await db().rpc("hackathon_create", { p_slug: slug, p_name: name, p_copy_from: copyFrom }));
}

export async function updateHackathon(id: string, patch: Partial<HackathonSettings>) {
  check(await db().from("hackathons").update(patch).eq("id", id));
}

export async function deleteHackathon(id: string) {
  check(await db().from("hackathons").delete().eq("id", id));
}

export async function fetchRoster(hackathonId: string): Promise<RosterRow[]> {
  return unwrap(
    await db().from("hackathon_roster").select("*").eq("hackathon_id", hackathonId).order("team_code"),
  );
}

export async function updateTeamName(teamId: string, name: string) {
  check(await db().from("hackathon_teams").update({ name }).eq("id", teamId));
}

export async function deleteTeam(teamId: string) {
  check(await db().from("hackathon_teams").delete().eq("id", teamId));
}

export async function updateParticipant(id: string, fields: Record<string, unknown>) {
  check(await db().from("hackathon_participants").update(fields).eq("id", id));
}

export async function deleteParticipant(id: string) {
  check(await db().from("hackathon_participants").delete().eq("id", id));
}

/** Manual override of one layer; `optionId = null` clears it. */
export async function setTeamStack(teamId: string, layer: string, optionId: number | null) {
  if (optionId === null) {
    check(await db().from("hackathon_team_stack").delete().eq("team_id", teamId).eq("layer", layer));
  } else {
    check(
      await db()
        .from("hackathon_team_stack")
        .upsert({ team_id: teamId, layer, option_id: optionId }, { onConflict: "team_id,layer" }),
    );
  }
}

export async function setTeamProblem(teamId: string, problemId: number | null) {
  check(await db().from("hackathon_teams").update({ problem_id: problemId }).eq("id", teamId));
}

/** Resolves with the number of teams drawn. */
export async function runDraw(hackathonId: string, redraw: boolean): Promise<number> {
  return unwrap(await db().rpc("hackathon_run_draw", { p_hackathon: hackathonId, p_redraw: redraw }));
}

export async function listOptions(hackathonId: string): Promise<TechOption[]> {
  return unwrap(
    await db().from("hackathon_tech_options").select("*").eq("hackathon_id", hackathonId).order("layer").order("name"),
  );
}

export async function saveOption(
  hackathonId: string,
  option: Pick<TechOption, "layer" | "name" | "weight" | "is_hard" | "active"> & { id?: number },
) {
  const { id, ...fields } = option;
  const table = db().from("hackathon_tech_options");
  check(id ? await table.update(fields).eq("id", id) : await table.insert({ ...fields, hackathon_id: hackathonId }));
}

export async function deleteOption(id: number) {
  check(await db().from("hackathon_tech_options").delete().eq("id", id));
}

export async function listProblems(hackathonId: string): Promise<Problem[]> {
  return unwrap(
    await db().from("hackathon_problems").select("*").eq("hackathon_id", hackathonId).order("title"),
  );
}

export async function saveProblem(
  hackathonId: string,
  problem: Pick<Problem, "title" | "gist" | "active"> & { id?: number },
) {
  const { id, ...fields } = problem;
  const table = db().from("hackathon_problems");
  check(id ? await table.update(fields).eq("id", id) : await table.insert({ ...fields, hackathon_id: hackathonId }));
}

export async function deleteProblem(id: number) {
  check(await db().from("hackathon_problems").delete().eq("id", id));
}
