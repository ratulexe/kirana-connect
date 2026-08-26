/**
 * Deterministic, category-based distribution-channel guidance for the
 * Market Reach section. This is generic prototype guidance for what a
 * business of this TYPE typically sells through -- not a claim about any
 * channel actually existing or having been observed at the entrepreneur's
 * specific location. The UI must always label this "Typical channels for
 * this business category," never "Observed local channels," unless a
 * future milestone adds real local evidence for a specific channel.
 *
 * Keyed by business_categories.slug, the same stable identifier used by
 * the OSM category mapping and the business/product category mapping.
 */
export const DISTRIBUTION_CHANNELS = {
  "grocery-store": [
    "Walk-in neighbourhood retail",
    "Local household purchases",
    "Small institutional/bulk buyers where applicable",
  ],
  "dairy-store": [
    "Walk-in retail",
    "Local household repeat purchases",
    "Nearby tea shops / food businesses where relevant",
  ],
  "fruits-vegetables": [
    "Walk-in retail",
    "Local household purchases",
    "Nearby food businesses and eateries where relevant",
  ],
  textiles: ["Walk-in retail", "Local market buyers"],
  stationery: ["Walk-in retail", "Nearby schools/institutions where applicable"],
  "electronics-retail": ["Walk-in retail", "Local household and small-business buyers"],
  "general-retail": ["Walk-in retail", "Local household purchases"],
};

export function typicalDistributionChannels(categorySlug) {
  return DISTRIBUTION_CHANNELS[categorySlug] ?? [];
}
