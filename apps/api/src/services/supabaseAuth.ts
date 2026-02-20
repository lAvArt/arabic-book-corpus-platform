import { createClient } from "@supabase/supabase-js";
import { env } from "../config.js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabaseClient;
}

export async function resolveUserIdFromBearerToken(authHeader?: string): Promise<string | null> {
  if (!authHeader) return null;
  const [kind, token] = authHeader.split(" ");
  if (kind?.toLowerCase() !== "bearer" || !token) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
