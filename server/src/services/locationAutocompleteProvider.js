import { env, isLocationAutocompleteConfigured } from "../config/env.js";
import { searchWithGeoapify } from "./locationAutocompleteProviders/geoapifyProvider.js";

/**
 * LocationAutocompleteProvider abstraction, mirroring advisorProvider.js's
 * shape exactly -- one selector, one registry, callers never import a vendor
 * SDK or know Geoapify exists.
 */
const PROVIDERS = {
  geoapify: { name: "geoapify", search: (query, opts) => searchWithGeoapify(query, { ...opts, apiKey: env.geoapifyApiKey }) },
};

export function getLocationAutocompleteProvider() {
  if (!isLocationAutocompleteConfigured) return null;
  return PROVIDERS[env.locationAutocompleteProvider] ?? null;
}
