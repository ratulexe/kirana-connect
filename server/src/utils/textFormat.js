/**
 * Normalizes a product name to sentence case.
 * 1. Trims leading/trailing whitespace
 * 2. Collapses repeated internal spaces
 * 3. Lowercases the string
 * 4. Uppercases the first alphabetic character
 */
export function normalizeProductName(input) {
  if (typeof input !== "string") return input;

  let normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized) return normalized;

  normalized = normalized.toLowerCase();

  const match = normalized.match(/[a-z]/i);
  if (match) {
    const idx = match.index;
    normalized =
      normalized.substring(0, idx) +
      normalized.charAt(idx).toUpperCase() +
      normalized.substring(idx + 1);
  }

  return normalized;
}
