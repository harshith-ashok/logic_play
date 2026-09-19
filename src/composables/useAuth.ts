import { ref } from "vue";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";

export type UserRole = "core_team" | "member" | "volunteer";

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  github_username: string | null;
  linkedin_url: string | null;
  leetcode_username: string | null;
  registration_number: string;
  role: UserRole;
  created_at: string;
}

export interface SignUpFields {
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  githubUsername?: string;
  linkedinUrl?: string;
  leetcodeUsername?: string;
  registrationNumber: string;
}

// Supabase Auth is email-based under the hood, but the product wants plain
// username+password — this synthetic address is never shown to the user and
// never sent anywhere; it's just a stable, valid-looking email Supabase Auth
// can key on. Requires "Confirm email" disabled in the Supabase dashboard
// (there's no real inbox to confirm).
function usernameEmail(username: string) {
  return `${username}@logicplay.local`;
}

// Module-level singleton so every component sees the same auth state
// without needing Pinia — mirrors useTheme.ts's pattern.
const session = ref<Session | null>(null);
const user = ref<User | null>(null);
const profile = ref<Profile | null>(null);
const ready = ref(false);

async function loadProfile(userId: string) {
  const client = getSupabase();
  if (!client) return;
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  profile.value = (data as Profile) ?? null;
}

function clearAuthState() {
  session.value = null;
  user.value = null;
  profile.value = null;
}

(function init() {
  const client = getSupabase();
  if (!client) {
    ready.value = true;
    return;
  }

  client.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;
    user.value = newSession?.user ?? null;
    if (newSession?.user) {
      loadProfile(newSession.user.id);
    } else {
      profile.value = null;
    }
  });

  client.auth.getSession().then(({ data }) => {
    session.value = data.session;
    user.value = data.session?.user ?? null;
    const finish = () => {
      ready.value = true;
    };
    if (data.session?.user) {
      loadProfile(data.session.user.id).then(finish);
    } else {
      finish();
    }
  });
})();

export function useAuth() {
  async function signUp(fields: SignUpFields) {
    const client = getSupabase();
    if (!client) return { error: "Auth is not configured." };

    // Profile row is created server-side by the on_auth_user_created trigger
    // (reads these from auth.users.raw_user_meta_data) — not inserted directly
    // by the client, since a direct insert here would fail profiles_insert_self's
    // RLS check before the client has a session/JWT.
    const { data, error } = await client.auth.signUp({
      email: usernameEmail(fields.username),
      password: fields.password,
      options: {
        data: {
          username: fields.username,
          first_name: fields.firstName,
          last_name: fields.lastName,
          github_username: fields.githubUsername || null,
          linkedin_url: fields.linkedinUrl || null,
          leetcode_username: fields.leetcodeUsername || null,
          registration_number: fields.registrationNumber,
        },
      },
    });

    if (error) {
      return {
        error: /profiles_username|already registered/i.test(error.message)
          ? "That username is already taken."
          : error.message,
      };
    }
    if (!data.user) return { error: "Sign up did not return a user." };

    return { error: null };
  }

  async function signIn(username: string, password: string) {
    const client = getSupabase();
    if (!client) return { error: "Auth is not configured." };
    const { error } = await client.auth.signInWithPassword({
      email: usernameEmail(username),
      password,
    });
    return { error: error ? "Incorrect username or password." : null };
  }

  async function signOut() {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
    clearAuthState();
  }

  async function updateProfile(
    fields: Partial<Omit<Profile, "id" | "role" | "username" | "created_at">>,
  ) {
    const client = getSupabase();
    if (!client || !user.value) return { error: "Not signed in." };
    const { error } = await client
      .from("profiles")
      .update(fields)
      .eq("id", user.value.id);
    if (!error) await loadProfile(user.value.id);
    return { error: error?.message ?? null };
  }

  return {
    session,
    user,
    profile,
    ready,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
}
