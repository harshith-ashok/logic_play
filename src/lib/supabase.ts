import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  if (!supabaseUrl || !supabaseKey) {
    const missing = [];
    if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
    if (!supabaseKey) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
    // eslint-disable-next-line no-console
    console.error(
      `Missing required environment variables for Supabase client: ${missing.join(", ")}`,
    );
    return null;
  }

  client = createClient(supabaseUrl, supabaseKey);
  return client;
}

// Backwards-compatible export: a lazily-resolved proxy that defers to the real client when available.
export const supabase: any = new Proxy(
  {},
  {
    get(_, prop) {
      const real = client ?? getSupabase();
      if (!real) {
        throw new Error(
          "Supabase client is not initialized. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set at build time and redeploy.",
        );
      }
      // @ts-ignore
      return real[prop];
    },
  },
);
