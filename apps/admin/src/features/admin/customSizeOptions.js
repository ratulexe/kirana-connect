const STORAGE_KEY = "kc.admin.customSizeOptions";

/**
 * Sizes an admin has typed in beyond the fixed lists in variantConfig.js
 * (e.g. Furniture's "Small/Medium/Large" not covering an "XL" sofa). There
 * is no backend table for this -- sized categories are a small hardcoded
 * config, not database rows -- so this persists the same lightweight way
 * useWishlist/useRecentSearches do on the consumer app: localStorage,
 * keyed by category slug, shared across every admin session on this
 * browser rather than scoped to one product.
 */
function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getCustomSizeOptions(categorySlug) {
  if (!categorySlug) return [];
  const sizes = readAll()[categorySlug];
  return Array.isArray(sizes) ? sizes : [];
}

/** Adds a size if it's not already present (case-insensitively); returns the trimmed value, or null if blank. */
export function addCustomSizeOption(categorySlug, value) {
  const trimmed = String(value ?? "").trim();
  if (!categorySlug || !trimmed) return null;

  const all = readAll();
  const existing = Array.isArray(all[categorySlug]) ? all[categorySlug] : [];
  if (existing.some((size) => size.toLowerCase() === trimmed.toLowerCase())) return trimmed;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [categorySlug]: [...existing, trimmed] }));
  } catch {
    // Storage unavailable (private browsing, quota) -- the value still
    // works for the rest of this session via the caller's own state.
  }
  return trimmed;
}
