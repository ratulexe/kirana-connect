import { httpError } from "../utils/httpError.js";
import { typicalDistributionChannels } from "../config/distributionChannels.js";
import { estimateConsumerPopulation } from "./population.service.js";
import { getActiveBusinessCategoryBySlug } from "./businessCategories.service.js";

/**
 * Geographic reach (radius, area) is exact and computed here. Estimated
 * consumer population depends entirely on the PopulationProvider, which
 * currently has no reliable source configured -- see population.service.js
 * for why -- so this never fabricates a population figure to fill the gap.
 */
export async function analyzeMarketReach({ lat, lng, radiusKm, categorySlug }) {
  const category = await getActiveBusinessCategoryBySlug(categorySlug);
  if (!category) throw httpError(400, "Unknown or inactive business category.");

  const marketAreaSqKm = Math.round(Math.PI * radiusKm ** 2 * 100) / 100;
  const population = await estimateConsumerPopulation({ lat, lng, radiusKm });

  return {
    location: { latitude: lat, longitude: lng },
    radiusKm,
    marketAreaSqKm,
    category: { slug: category.slug, name: category.name },
    population,
    distributionChannels: typicalDistributionChannels(category.slug),
  };
}
