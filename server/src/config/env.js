import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Resolve the .env relative to the server package so the app behaves the same
// whether it is started from the repo root or from server/.
dotenv.config({ path: path.resolve(currentDir, "../../.env"), quiet: true });

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value, fallback) =>
  (value ?? fallback)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT, 5000),
  clientUrls: parseOrigins(process.env.CLIENT_URL, "http://localhost:5173"),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};

export const isProduction = env.nodeEnv === "production";

// Public discovery endpoints only need the anon key, and are safer with it,
// because row level security still applies.
export const isPublicSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey,
);

// The service role bypasses RLS and is reserved for privileged work.
export const isServiceSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey,
);

export const isSupabaseConfigured =
  isPublicSupabaseConfigured || isServiceSupabaseConfigured;
