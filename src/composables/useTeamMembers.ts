import { ref } from "vue";
import { getSupabase } from "../lib/supabase";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  focus: string;
  filled: boolean;
  sort_order: number;
}

export type TeamMemberFields = Omit<TeamMember, "id">;

export function useTeamMembers() {
  const members = ref<TeamMember[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;

    const client = getSupabase();
    if (!client) {
      error.value = "Could not load the team roster.";
      loading.value = false;
      return;
    }

    const { data, error: fetchError } = await client
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fetchError) {
      error.value = "Could not load the team roster.";
      loading.value = false;
      return;
    }

    members.value = (data as TeamMember[]) ?? [];
    loading.value = false;
  }

  async function addMember(fields: TeamMemberFields) {
    const client = getSupabase();
    if (!client) return { error: "Not available right now." };
    const { error: insertError } = await client.from("team_members").insert(fields);
    if (insertError) return { error: insertError.message };
    await load();
    return { error: null };
  }

  async function updateMember(id: string, fields: Partial<TeamMemberFields>) {
    const client = getSupabase();
    if (!client) return { error: "Not available right now." };
    const { error: updateError } = await client
      .from("team_members")
      .update(fields)
      .eq("id", id);
    if (updateError) return { error: updateError.message };
    await load();
    return { error: null };
  }

  async function deleteMember(id: string) {
    const client = getSupabase();
    if (!client) return { error: "Not available right now." };
    const { error: deleteError } = await client.from("team_members").delete().eq("id", id);
    if (deleteError) return { error: deleteError.message };
    await load();
    return { error: null };
  }

  load();

  return { members, loading, error, load, addMember, updateMember, deleteMember };
}
