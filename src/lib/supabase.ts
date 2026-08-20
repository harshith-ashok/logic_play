import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Provide a clearer runtime error so Vercel logs show missing env details
  const missing = [];
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!supabaseKey) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
  // eslint-disable-next-line no-console
  console.error(
    `Missing required environment variables for Supabase client: ${missing.join(", ")}`,
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "");
