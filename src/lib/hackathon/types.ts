// Shapes of the hackathon tables/RPCs defined in supabase/hackathon_portal.sql.

export interface Hackathon {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  layers: string[];
  registration_open: boolean;
  roulette_open: boolean;
  max_problem_changes: number;
  max_stack_rerolls: number;
  max_teams: number;
  min_team_size: number;
  max_team_size: number;
  whatsapp_link: string | null;
  draw_seed: string;
  created_at: string;
}

export type HackathonSettings = Pick<
  Hackathon,
  "name" | "description" | "layers" | "registration_open" | "roulette_open" | "max_problem_changes" | "max_stack_rerolls" | "max_teams" | "min_team_size" | "max_team_size" | "whatsapp_link"
>;

export interface TechOption {
  id: number;
  hackathon_id: string;
  layer: string;
  name: string;
  weight: number;
  is_hard: boolean;
  active: boolean;
}

export interface Problem {
  id: number;
  hackathon_id: string;
  title: string;
  gist: string | null;
  active: boolean;
}

/** What a participant types into the form (everything a string until validated). */
export interface PersonInput {
  full_name: string;
  registration_number: string;
  year_of_study: string;
  phone: string;
  department: string;
  college: string;
}

export interface RegistrationStatus {
  name: string;
  description: string | null;
  open: boolean;
  min_team_size: number;
  max_team_size: number;
}

export interface RegistrationResult {
  team_code: string;
  team_name: string;
  whatsapp_link: string | null;
}

/** One row of the hackathon_roster view: one person, with their team's draw. */
export interface RosterRow {
  hackathon_id: string;
  team_id: string;
  team_code: string;
  team_name: string;
  participant_id: string;
  role: "leader" | "member";
  full_name: string;
  registration_number: string;
  year_of_study: number;
  phone: string;
  department: string;
  college: string;
  stack: Record<string, string>;
  problem_id: number | null;
  problem_statement: string | null;
  problem_gist: string | null;
  assigned_at: string | null;
  registered_at: string;
  problem_changes: number;
  stack_rerolls: number;
  github_url: string | null;
  vercel_url: string | null;
  submitted_at: string | null;
}

export type Person = Pick<
  RosterRow,
  "participant_id" | "role" | "full_name" | "registration_number" | "year_of_study" | "phone" | "department" | "college"
>;

/** A team, assembled client-side from roster rows. */
export interface Team {
  id: string;
  code: string;
  name: string;
  stack: Record<string, string>;
  problemId: number | null;
  problem: string | null;
  drawn: boolean;
  registeredAt: string;
  problemChanges: number;
  stackRerolls: number;
  githubUrl: string | null;
  vercelUrl: string | null;
  people: Person[];
  leader: Person | undefined;
}

/** What a team sees after entering its code + leader reg number. */
export interface TeamResult {
  team_name: string;
  team_code: string;
  drawn: boolean;
  /** Whether teams may currently pick a problem (and so draw a stack). */
  roulette_open: boolean;
  /** Problem swaps used / allowed (each swap re-deals the stack). */
  problem_changes: number;
  max_problem_changes: number;
  /** Stack-only re-rolls used / allowed (problem is kept). */
  stack_rerolls: number;
  max_stack_rerolls: number;
  /** Active problems the team can choose from. */
  problems: { id: number; title: string; gist: string | null }[];
  problem_id: number | null;
  /** In layer order; empty until drawn. */
  stack: { layer: string; name: string }[];
  /** Active option names per layer, used only for the reveal animation. */
  pool: Record<string, string[]>;
  problem_title: string | null;
  problem_gist: string | null;
  /** Submitted project links, null until the team submits. */
  github_url: string | null;
  vercel_url: string | null;
}
