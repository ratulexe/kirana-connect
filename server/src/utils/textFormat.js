/**
 * Normalizes a product name to title case, independent of how the admin typed
 * it: "britannia milk bikis" and "BRITANNIA MILK BIKIS" both save as
 * "Britannia Milk Bikis".
 * 1. Trims leading/trailing whitespace
 * 2. Collapses repeated internal spaces
 * 3. Lowercases the string
 * 4. Uppercases the first letter of every word
 */
export function normalizeProductName(input) {
  if (typeof input !== "string") return input;

  let normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized) return normalized;

  normalized = normalized
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_match, boundary, letter) => boundary + letter.toUpperCase());

  return normalized;
}
