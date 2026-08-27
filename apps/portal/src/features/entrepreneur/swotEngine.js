import { ELIGIBLE_STATUS } from "./financialEngine.js";

/**
 * Evidence-based SWOT (Module 9). Every item traces back to a real,
 * already-computed metric -- {title, evidence, source} -- so nothing here
 * is a generated opinion. The threats quadrant is not re-derived: it is
 * exactly threatEngine.js's output, reshaped, so there is one source of
 * truth for threats rather than two engines that could disagree.
 *
 * A missing dataset is deliberately worded as a planning limitation
 * ("insufficient demand history", "no verified population estimate"), not
 * as a fault of the business itself -- the distinction the spec for this
 * milestone asked to keep clear.
 */

function item(title, evidence, source) {
  return { title, evidence, source };
}

function buildStrengths({ demandSupply, financialPlan, priceIntelligence }) {
  const strengths = [];

  if (financialPlan.status === ELIGIBLE_STATUS) {
    strengths.push(
      item(
        "Financial structure available",
        `Your margin capital fits the configured ${financialPlan.scheme.name} range.`,
        "Financial Roadmap",
      ),
    );
  }

  if (demandSupply?.analysisStatus === "ok" && demandSupply.supply.participatingStores > 0) {
    strengths.push(
      item(
        "Participating local supply exists",
        `${demandSupply.supply.participatingStores} participating Kirana Connect store${demandSupply.supply.participatingStores === 1 ? "" : "s"} carry relevant products within the selected radius.`,
        "Demand & Supply Gap",
      ),
    );
  }

  if (priceIntelligence?.analysisStatus === "ok" && priceIntelligence.dataSufficiency === "available") {
    strengths.push(
      item(
        "Clear local price observations exist",
        `Local selling-price data is available for ${priceIntelligence.summary.productsWithObservations} relevant products.`,
        "Local Product Market Value",
      ),
    );
  }

  if (demandSupply?.analysisStatus === "ok" && demandSupply.explicitProductRequests > 0) {
    strengths.push(
      item(
        "Explicit customer interest exists",
        `${demandSupply.explicitProductRequests} customer${demandSupply.explicitProductRequests === 1 ? " has" : "s have"} explicitly requested specific products in this area.`,
        "Demand & Supply Gap",
      ),
    );
  }

  return strengths;
}

function buildWeaknesses({ demandSupply, financialPlan, priceIntelligence, marketReach }) {
  const weaknesses = [];

  if (demandSupply?.analysisStatus === "ok" && demandSupply.dataSufficiency === "no-data") {
    weaknesses.push(
      item(
        "Insufficient demand history",
        "Local Consumer search activity recorded so far is not enough to confirm demand patterns -- a planning limitation, not evidence that demand is absent.",
        "Demand & Supply Gap",
      ),
    );
  }

  if (financialPlan.status === ELIGIBLE_STATUS && financialPlan.fundingGap > 0) {
    weaknesses.push(
      item(
        "Funding gap",
        `A funding gap of ₹${financialPlan.fundingGap.toLocaleString("en-IN")} remains after eligible agency finance.`,
        "Financial Roadmap",
      ),
    );
  }

  // Unlike demandSupply/priceIntelligence, Market Reach has no partial-success
  // "analysisStatus" of its own -- analyzeMarketReach() either succeeds
  // outright or throws, so a successfully loaded object is all there is to
  // check (matching buildAdvisorContext.js's summarizeMarketReach, which
  // checks marketReachState.status === "loaded" for the same reason).
  if (marketReach && marketReach.population.status !== "available") {
    weaknesses.push(
      item(
        "No verified population estimate",
        "A local demographic/population data source is not currently configured for this analysis.",
        "Market Reach",
      ),
    );
  }

  if (priceIntelligence?.analysisStatus === "ok" && priceIntelligence.dataSufficiency !== "available") {
    weaknesses.push(
      item(
        "Insufficient price observations",
        priceIntelligence.dataSufficiency === "no-price-data"
          ? "No participating-store price listings were found for this business category in the selected radius."
          : "Only a single price observation was found -- not enough to characterize a local price range.",
        "Local Product Market Value",
      ),
    );
  }

  if (demandSupply?.analysisStatus === "ok" && demandSupply.supply.participatingStores === 0) {
    weaknesses.push(
      item(
        "No participating local supply",
        "No participating Kirana Connect stores were found carrying relevant products within the selected radius.",
        "Demand & Supply Gap",
      ),
    );
  }

  return weaknesses;
}

const MIN_PRICE_SPREAD_STORES = 3;

/**
 * Five evidence-backed rules, each independent -- none of them invent
 * generic business advice, and none of them are the Opportunity Score
 * itself (feasibilityEngine.js owns that number; this only ever describes
 * evidence in words). A quadrant with none of these conditions met shows
 * "No supported opportunity signal identified yet" rather than being padded.
 */
function buildOpportunities({ demandSupply, priceIntelligence }) {
  const opportunities = [];

  // Rule 1: repeated unmet category-linked demand. Deliberately gated on
  // dataSufficiency === "available" -- absence of data is never treated as
  // evidence of an opportunity.
  if (
    demandSupply?.analysisStatus === "ok" &&
    demandSupply.dataSufficiency === "available" &&
    demandSupply.demand.unmetDemandEvents > 0
  ) {
    opportunities.push(
      item(
        "Observed unmet category demand",
        `${demandSupply.demand.unmetDemandEvents} of ${demandSupply.demand.totalRelevantSearches} category-linked Consumer searches were unmet in the selected analysis period.`,
        "Demand & Supply Gap",
      ),
    );
  }

  // Rule 2: participating supply coverage gap against the relevant
  // catalogue (platform-wide), not "unavailable in the entire market" --
  // external businesses may stock what Kirana Connect cannot observe.
  if (demandSupply?.analysisStatus === "ok") {
    const { relevantProductsAvailable, totalRelevantCatalogueProducts } = demandSupply.supply;
    if (totalRelevantCatalogueProducts > relevantProductsAvailable) {
      const missing = totalRelevantCatalogueProducts - relevantProductsAvailable;
      opportunities.push(
        item(
          "Participating supply coverage gap",
          `${missing} of ${totalRelevantCatalogueProducts} relevant catalogue products are not currently visible across participating Kirana Connect stores within this radius.`,
          "Demand & Supply Gap",
        ),
      );
    }
  }

  // Rule 3: explicit "notify me" product interest -- a stronger, more
  // deliberate signal than a search, kept separate from Rule 1.
  if (demandSupply?.analysisStatus === "ok" && demandSupply.explicitProductRequests > 0) {
    opportunities.push(
      item(
        "Explicit customer product interest",
        `${demandSupply.explicitProductRequests} explicit product request${demandSupply.explicitProductRequests === 1 ? " was" : "s were"} recorded in this area during the analysis period.`,
        "Demand & Supply Gap",
      ),
    );
  }

  // Rule 4: unclassified zero-result search leads. A different kind of item
  // on purpose -- these are NOT scored (see feasibilityEngine.js, which
  // only ever uses category-linked demand) and the caveat below says so
  // explicitly rather than letting the reader assume they were counted.
  if (demandSupply?.analysisStatus === "ok" && demandSupply.unclassifiedUnmetQueries.length > 0) {
    const examples = demandSupply.unclassifiedUnmetQueries
      .slice(0, 3)
      .map((q) => `"${q.query}"`)
      .join(", ");
    opportunities.push(
      item(
        "Potential unmet-demand leads requiring classification",
        `Consumers searched for ${examples} without a matching catalogue result. These queries are not yet mapped to the selected business category and are excluded from the Opportunity Score.`,
        "Consumer Search Signals",
      ),
    );
  }

  // Rule 5: local price differentiation -- only from a genuine multi-store
  // spread (at least 3 participating stores), never single-store data, and
  // never framed as automatically profitable.
  if (priceIntelligence?.analysisStatus === "ok" && priceIntelligence.dataSufficiency === "available") {
    const spread = priceIntelligence.products.find(
      (p) => p.storesRepresented >= MIN_PRICE_SPREAD_STORES && p.maxPrice > p.minPrice,
    );
    if (spread) {
      opportunities.push(
        item(
          "Observed price differentiation",
          `${spread.productName} (${spread.variantLabel}) is sold between ₹${spread.minPrice} and ₹${spread.maxPrice} across ${spread.storesRepresented} participating stores, indicating variation in local retail pricing.`,
          "Local Product Market Value",
        ),
      );
    }
  }

  return opportunities;
}

function toSwotThreat(threat) {
  return item(threat.title, threat.evidence, "Local Business Risks");
}

/**
 * threats is threatEngine.js's own output ({threats, unassessableRisks}) --
 * reused directly, not recomputed, so this quadrant can never disagree with
 * the Local Business Risks section.
 */
export function buildSwotAnalysis({ demandSupplyState, financialPlan, priceIntelligenceState, marketReachState, threats }) {
  const demandSupply = demandSupplyState?.status === "loaded" ? demandSupplyState.data : null;
  const priceIntelligence = priceIntelligenceState?.status === "loaded" ? priceIntelligenceState.data : null;
  const marketReach = marketReachState?.status === "loaded" ? marketReachState.data : null;

  return {
    strengths: buildStrengths({ demandSupply, financialPlan, priceIntelligence }),
    weaknesses: buildWeaknesses({ demandSupply, financialPlan, priceIntelligence, marketReach }),
    opportunities: buildOpportunities({ demandSupply, priceIntelligence }),
    threats: threats.map(toSwotThreat),
  };
}
