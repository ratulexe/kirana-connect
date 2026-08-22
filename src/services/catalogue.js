import { apiGet } from "../lib/api.js";

/**
 * Discovery reads for the customer app. Every call goes through the Express
 * API, never straight to Supabase.
 */
export async function fetchCategories({ signal } = {}) {
  const { data } = await apiGet("/categories", { signal });
  return data;
}
