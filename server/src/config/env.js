import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Prefer the server package's environment file, with the repository root as a
// local-development fallback when the shared frontend environment is present.
dotenv.config({
  path: [
    path.resolve(currentDir, "../../.env"),
    path.resolve(currentDir, "../../../.env"),
  ],
  quiet: true,
});

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value, fallback) =>
  (value ?? fallback)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV ?? "development";
const localClientUrls = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
const configuredClientUrls = parseOrigins(process.env.CLIENT_URL, localClientUrls.join(","));

export const env = {
  nodeEnv,
  port: parsePort(process.env.PORT, 5000),
  clientUrls:
    nodeEnv === "development"
      ? [...new Set([...configuredClientUrls, ...localClientUrls])]
      : configuredClientUrls,
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
