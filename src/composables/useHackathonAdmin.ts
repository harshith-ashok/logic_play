import { computed, ref } from "vue";
import * as api from "../lib/hackathon/api";
import type { Hackathon, Problem, RosterRow, Team, TechOption } from "../lib/hackathon/types";

/** Groups roster rows (one per person) into teams, leader first. */
export function groupTeams(rows: RosterRow[]): Team[] {
  const byId = new Map<string, Team>();
  for (const r of rows) {
    let team = byId.get(r.team_id);
    if (!team) {
      team = {
        id: r.team_id,
        code: r.team_code,
        name: r.team_name,
        stack: r.stack,
        problemId: r.problem_id,
        problem: r.problem_statement,
        drawn: r.assigned_at !== null,
        registeredAt: r.registered_at,
        problemChanges: r.problem_changes,
        stackRerolls: r.stack_rerolls,
        githubUrl: r.github_url,
        vercelUrl: r.vercel_url,
        people: [],
        leader: undefined,
      };
      byId.set(r.team_id, team);
    }
    team.people.push(r);
    if (r.role === "leader") team.leader = r;
  }
  return [...byId.values()];
}

/** State + actions for one hackathon's admin dashboard, keyed by slug. */
export function useHackathonAdmin(slug: string) {
  const hackathon = ref<Hackathon | null>(null);
  const options = ref<TechOption[]>([]);
  const problems = ref<Problem[]>([]);
  const teams = ref<Team[]>([]);
  const loading = ref(true);
  const error = ref("");

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const h = await api.getHackathon(slug);
      hackathon.value = h;
      if (h) await refreshAll(h.id);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function refreshAll(id: string) {
    const [opts, probs, roster] = await Promise.all([
      api.listOptions(id),
      api.listProblems(id),
      api.fetchRoster(id),
    ]);
    options.value = opts;
    problems.value = probs;
    teams.value = groupTeams(roster);
  }

  /** Runs a mutation then reloads everything; resolves with an error string (or "") for the caller's UI. */
  async function run<T>(action: () => Promise<T>): Promise<{ value?: T; error: string }> {
    try {
      const value = await action();
      const id = hackathon.value?.id;
      if (id) {
        // draw_seed rotates on redraw and settings may change, so refetch the row too.
        hackathon.value = await api.getHackathon(slug);
        await refreshAll(id);
      }
      return { value, error: "" };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const stats = computed(() => {
    const total = teams.value.length;
    const drawn = teams.value.filter((t) => t.drawn).length;
    return {
      teams: total,
      cap: hackathon.value?.max_teams ?? 0,
      participants: teams.value.reduce((n, t) => n + t.people.length, 0),
      drawn,
      undrawn: total - drawn,
    };
  });

  return { hackathon, options, problems, teams, loading, error, stats, load, run };
}
