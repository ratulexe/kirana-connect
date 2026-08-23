const MAX_SLUG_LENGTH = 60;
const FALLBACK_SLUG = "store";

/**
 * URL-safe slug matching the stores_slug_format constraint:
 * lowercase alphanumeric groups joined by single hyphens.
 */
export function slugify(value) {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug || FALLBACK_SLUG;
}

const SUFFIX_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

function randomSuffix(length = 4) {
  let suffix = "";
  for (let i = 0; i < length; i += 1) {
    suffix += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
  }
  return suffix;
}

/**
 * Finds a free slug for a store name.
 *
 * Collisions are resolved on the server against the live table, never by the
 * browser: a client-side uniqueness check is always a race, and slug is a
 * UNIQUE column, so losing that race would surface as a raw database error.
 *
 * `isTaken` is injected so this stays a pure function that is trivial to test.
 */
export async function generateUniqueSlug(name, isTaken, { attempts = 5 } = {}) {
  const base = slugify(name);

  if (!(await isTaken(base))) return base;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    // Trim the base so base + suffix still fits inside the column budget.
    const trimmed = base.slice(0, MAX_SLUG_LENGTH - 5).replace(/-+$/g, "");
    const candidate = `${trimmed || FALLBACK_SLUG}-${randomSuffix()}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // Astronomically unlikely, but never return a slug we know collides.
  return `${base.slice(0, MAX_SLUG_LENGTH - 14).replace(/-+$/g, "") || FALLBACK_SLUG}-${Date.now().toString(36)}`;
}
