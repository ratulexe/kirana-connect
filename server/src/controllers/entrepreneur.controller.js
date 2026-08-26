import { resolveLocationCandidates } from "../services/geocoding.service.js";
import { discoverCompetitors } from "../services/competitors.service.js";
import { analyzeDemandSupply } from "../services/demandSupply.service.js";
import { analyzeMarketReach } from "../services/marketReach.service.js";
import { analyzePriceIntelligence } from "../services/priceIntelligence.service.js";
import { getLocationSuggestions } from "../services/locationAutocomplete.service.js";
import {
  validateLocationQuery,
  validateLocationSuggestQuery,
  validateCompetitorQuery,
  validateDemandSupplyQuery,
} from "../utils/validateEntrepreneur.js";

export async function getLocationCandidates(req, res) {
  const query = validateLocationQuery(req.query);
  const candidates = await resolveLocationCandidates(query);
  res.status(200).json({ success: true, data: { candidates } });
}

export async function getLocationSuggestionsHandler(req, res) {
  const { q, limit } = validateLocationSuggestQuery(req.query);
  const result = await getLocationSuggestions(q, { limit });
  res.status(200).json({ success: true, data: result });
}

export async function getCompetitors(req, res) {
  const { lat, lng, radiusKm, categorySlug } = validateCompetitorQuery(req.query);
  const result = await discoverCompetitors({ lat, lng, radiusKm, categorySlug });

  res.status(200).json({
    success: true,
    data: {
      location: { latitude: lat, longitude: lng },
      radiusKm,
      category: { slug: result.category.slug, name: result.category.name },
      summary: result.summary,
      competitors: result.competitors,
      externalProviderStatus: result.externalProviderStatus,
      sources: result.sources,
    },
  });
}

export async function getDemandSupply(req, res) {
  const { lat, lng, radiusKm, categorySlug, days } = validateDemandSupplyQuery(req.query);
  const data = await analyzeDemandSupply({ lat, lng, radiusKm, categorySlug, days });
  res.status(200).json({ success: true, data });
}

export async function getMarketReach(req, res) {
  const { lat, lng, radiusKm, categorySlug } = validateCompetitorQuery(req.query);
  const data = await analyzeMarketReach({ lat, lng, radiusKm, categorySlug });
  res.status(200).json({ success: true, data });
}

export async function getPriceIntelligence(req, res) {
  const { lat, lng, radiusKm, categorySlug, days } = validateDemandSupplyQuery(req.query);
  const data = await analyzePriceIntelligence({ lat, lng, radiusKm, categorySlug, days });
  res.status(200).json({ success: true, data });
}
