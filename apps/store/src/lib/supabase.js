import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/store/.env.",
  );
}

/**
 * Browser Supabase client for the Store Portal.
 *
 * Anon key only. The service-role key bypasses row level security and must
 * never reach a Vite bundle. Supabase owns session persistence and refresh;
 * the app never copies the access token into its own state.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Where Supabase should send a user after they confirm their email address.
 * Configurable so staging and production are not stuck on a localhost URL.
 */
export const authRedirectUrl =
  import.meta.env.VITE_AUTH_REDIRECT_URL ??
  (typeof window !== "undefined" ? `${window.location.origin}/login` : undefined);
