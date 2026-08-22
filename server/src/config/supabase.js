import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env.js";

let client = null;

/**
 * Returns the shared Supabase client, created on first use.
 *
 * The client is built lazily so the API can boot and serve non-Supabase routes
 * while credentials are still missing. The service role key bypasses RLS and
 * must never be sent to the browser.
 */
export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    const error = new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.",
    );
    error.status = 503;
    throw error;
  }

  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}
