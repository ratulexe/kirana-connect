import { z } from "zod";

/**
 * Business type the entrepreneur wants to start -- distinct from Kirana
 * Connect's product catalogue categories (Beverages, Snacks, ...), which
 * describe what a store sells, not what kind of business someone is opening.
 *
 * The real taxonomy lives server-side in business_categories and is fetched
 * live by EntrepreneurHome (see services/businessCategories.js). This
 * constant is kept only as the documented, explicit FALLBACK used if that
 * fetch fails -- slugs included (not just display names) since the fallback
 * must still be able to drive a real competitor-discovery request, not just
 * render a label.
 */
export const BUSINESS_CATEGORIES_FALLBACK = [
  { name: "Grocery Store", slug: "grocery-store" },
  { name: "Dairy Store", slug: "dairy-store" },
  { name: "Fruits & Vegetables", slug: "fruits-vegetables" },
  { name: "Textiles", slug: "textiles" },
  { name: "Stationery", slug: "stationery" },
  { name: "Electronics Retail", slug: "electronics-retail" },
  { name: "General Retail", slug: "general-retail" },
];

export const RADIUS_OPTIONS = [5, 10];
export const DEFAULT_RADIUS_KM = 5;

export const entrepreneurInputSchema = z.object({
  locationQuery: z
    .string()
    .trim()
    .min(3, "Enter a village, town, block, or district")
    .max(160, "Keep this under 160 characters"),
  availableMargin: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce
      .number({ error: "Enter your available margin" })
      .positive("Enter an amount greater than zero")
      .max(100_000_000, "That amount looks too large"),
  ),
  // The select's value is the category slug, not its display name -- see
  // BUSINESS_CATEGORIES_FALLBACK. Validity means "chosen from whatever the
  // dropdown actually offered," which non-empty already captures.
  businessCategorySlug: z.string().trim().min(1, "Choose a business category"),
  radiusKm: z.coerce.number().refine((value) => RADIUS_OPTIONS.includes(value), "Choose a valid radius"),
});

/**
 * Shape the analysis page (and the competitor-discovery request it makes)
 * consumes. location carries real, geocoder-resolved coordinates -- this
 * function is only ever called after the location-resolution step in
 * EntrepreneurHome has confirmed a single real place, never with a guess.
 */
export function toEntrepreneurAnalysisInput({ values, location, businessCategory }) {
  return {
    location,
    availableMargin: values.availableMargin,
    businessCategory,
    radiusKm: values.radiusKm,
  };
}
