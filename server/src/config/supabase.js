import { createClient } from "@supabase/supabase-js";
import {
  env,
  isPublicSupabaseConfigured,
  isServiceSupabaseConfigured,
} from "./env.js";

let publicClient = null;
let serviceClient = null;

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

function missing(message) {
  const error = new Error(message);
  error.status = 503;
  return error;
}

/**
 * Client for public, customer-facing reads.
 *
 * Deliberately uses the anon key rather than the service role, so every query
 * is still filtered by row level security. If a filter is ever forgotten in
 * application code, the database is the backstop and unverified stores or
 * inactive products still cannot leak.
 */
export function getPublicClient() {
  if (!isPublicSupabaseConfigured) {
    throw missing(
      "Supabase public client is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.",
    );
  }

  if (!publicClient) {
    publicClient = createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
  }

  return publicClient;
}

/**
 * Client for privileged work: verifying stores, curating the catalogue,
 * promoting a profile to seller.
 *
 * The service role key bypasses RLS entirely, so this must never be used to
 * serve an unauthenticated request and must never reach the browser.
 */
export function getServiceClient() {
  if (!isServiceSupabaseConfigured) {
    throw missing(
      "Supabase service client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env.",
    );
  }

  if (!serviceClient) {
    serviceClient = createClient(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      clientOptions,
    );
  }

  return serviceClient;
}
