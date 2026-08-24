import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appOrigin =
  import.meta.env.VITE_APP_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const authRedirectUrl = `${appOrigin.replace(/\/$/, "")}/account`;
export const passwordResetRedirectUrl = `${appOrigin.replace(/\/$/, "")}/reset-password`;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
  );
}

// Stays null until credentials are provided so the app does not crash during setup.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
