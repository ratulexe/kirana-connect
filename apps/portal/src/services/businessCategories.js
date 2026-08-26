import { apiGet } from "../lib/apiBase.js";

/**
 * Fetches the shared, live business-category taxonomy from the backend
 * (Portal -> Backend API -> business_categories), rather than duplicating
 * it as a second hardcoded list.
 */
export async function fetchActiveBusinessCategories({ signal } = {}) {
  return apiGet("/api/business-categories", { signal });
}
