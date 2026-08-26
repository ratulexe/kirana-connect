/**
 * Joins class names, dropping anything falsy.
 * Small on purpose: the project does not need clsx or tailwind-merge yet.
 */
export function cn(...values) {
  return values.filter(Boolean).join(" ");
}
