import { ref } from "vue";
import { getSupabase } from "../lib/supabase";

export interface SiteSettings {
  announcement_text: string | null;
  announcement_link: string | null;
  join_link: string;
}

export function useSiteSettings() {
  const settings = ref<SiteSettings | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;

    const client = getSupabase();
    if (!client) {
      loading.value = false;
      return;
    }

    const { data, error: fetchError } = await client
      .from("site_settings")
      .select("announcement_text, announcement_link, join_link")
      .eq("id", 1)
      .single();

    if (fetchError) {
      error.value = "Could not load site settings.";
      loading.value = false;
      return;
    }

    settings.value = data as SiteSettings;
    loading.value = false;
  }

  async function updateSettings(fields: Partial<SiteSettings>) {
    const client = getSupabase();
    if (!client) return { error: "Not available right now." };
    const { error: updateError } = await client
      .from("site_settings")
      .update(fields)
      .eq("id", 1);
    if (updateError) return { error: updateError.message };
    await load();
    return { error: null };
  }

  load();

  return { settings, loading, error, load, updateSettings };
}
