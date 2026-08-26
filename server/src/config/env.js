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
const localClientUrls = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];
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

  // Centralized so no service file hard-codes a third-party endpoint. Both
  // default to the public OpenStreetMap-run instances, which is fine for
  // this prototype's traffic level; a self-hosted or paid instance is a
  // config change here, not a code change anywhere else.
  osmNominatimUrl: process.env.OSM_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  osmOverpassUrl: process.env.OSM_OVERPASS_URL ?? "https://overpass-api.de/api/interpreter",
  // Nominatim's usage policy requires an identifying User-Agent; Overpass has
  // no such hard requirement but honours the same courtesy.
  osmUserAgent: process.env.OSM_USER_AGENT ?? "KiranaConnect/0.1 (https://github.com/ratulexe/kirana-connect)",

  // AI Business Advisor (Module 11). Provider-agnostic on purpose -- the
  // rest of the app talks to advisor.service.js, never to a vendor SDK
  // directly. With no key configured the advisor endpoint reports itself as
  // unconfigured rather than crashing; the deterministic report never
  // depends on this being set.
  aiAdvisorProvider: process.env.AI_ADVISOR_PROVIDER ?? "gemini",
  aiAdvisorApiKey: process.env.AI_ADVISOR_API_KEY ?? "",
  // Model is configurable so deployment environments can choose the
  // appropriate currently supported Gemini model without changing code.
  aiAdvisorModel: process.env.AI_ADVISOR_MODEL ?? "gemini-3.5-flash-lite",

  // Location autocomplete (search-as-you-type). Deliberately a separate
  // provider from geocoding.service.js's Nominatim integration -- Nominatim's
  // public-instance usage policy does not permit keystroke-driven autocomplete
  // traffic, so that integration stays reserved for explicit final-submit
  // resolution only. With no key configured, autocomplete reports itself as
  // unavailable and the existing submit-time flow keeps working unaffected.
  locationAutocompleteProvider: process.env.LOCATION_AUTOCOMPLETE_PROVIDER ?? "geoapify",
  geoapifyApiKey: process.env.GEOAPIFY_API_KEY ?? "",
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

export const isAiAdvisorConfigured = Boolean(env.aiAdvisorApiKey);

export const isLocationAutocompleteConfigured = Boolean(env.geoapifyApiKey);
