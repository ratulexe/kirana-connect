import { ELIGIBLE_STATUS } from "./financialEngine.js";

/**
 * Feasibility Assessment engine (Module 8). Pure and deterministic, no AI,
 * no network calls -- everything it needs (the demand-supply fetch result
 * and the already-computed financial plan) is passed in by the caller,
 * exactly like financialEngine.js.
 *
 * The central rule this whole file exists to enforce: absence of data is
 * never treated as negative evidence. Zero recorded searches means "we do
 * not know," not "there is no demand" -- every component below has an
 * explicit unavailable/insufficient-data state instead of silently
 * defaulting to a number that would misrepresent an unknown as a zero.
 */

// -----------------------------------------------------------------------
// Prototype Opportunity Score -- a transparent decision-support heuristic,
// NOT a profitability prediction, success probability, loan-approval score
// or ML output. The single source of truth for the four component weights;
// nothing outside this file hard-codes 40/25/20/15 anywhere.
// -----------------------------------------------------------------------
export const OPPORTUNITY_SCORE_WEIGHTS = {
  unmetDemand: 0.4,
  supplyGap: 0.25,
  competition: 0.2,
  financialFit: 0.15,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Purely descriptive sample-size labels for the demand evidence volume --
 * NOT a statistical confidence rating. A "developing" sample is not more
 * "trustworthy" in any measured sense; it is only a larger count of
 * category-linked searches observed so far. The score formula itself never
 * changes based on this label.
 */
function demandSampleStatus(relevantSearches) {
  if (relevantSearches <= 0) return "no-data";
  if (relevantSearches <= 4) return "very-limited";
  if (relevantSearches <= 19) return "limited";
  return "developing";
}

/**
 * 40% weight. Category-linked demand only -- unclassified zero-result
 * queries never enter this number (they surface separately, as SWOT leads;
 * see swotEngine.js). "0" means no unmet demand was observed in the
 * current sample, not that no market demand exists.
 */
function computeUnmetDemandScore(demandSupply) {
  const { totalRelevantSearches, unmetDemandEvents } = demandSupply.demand;
  const evidence = { relevantSearches: totalRelevantSearches, unmetEvents: unmetDemandEvents };

  if (totalRelevantSearches <= 0) return { status: "unavailable", score: null, evidence };

  const score = clamp((unmetDemandEvents / totalRelevantSearches) * 100, 0, 100);
  return { status: "available", score, evidence };
}

/**
 * 25% weight. Gap between the relevant catalogue (every product in this
 * category's mapped product categories, platform-wide) and what is
 * currently visible across participating Kirana Connect stores in this
 * radius. This is NOT "% unavailable in the real-world market" -- external
 * businesses may stock products Kirana Connect has no visibility into at
 * all; that limitation is carried as a caveat wherever the score is shown.
 */
function computeSupplyGapScore(demandSupply) {
  const { relevantProductsAvailable, totalRelevantCatalogueProducts } = demandSupply.supply;
  const evidence = {
    relevantCatalogueProducts: totalRelevantCatalogueProducts ?? 0,
    locallyAvailableProducts: relevantProductsAvailable,
  };

  if (!totalRelevantCatalogueProducts || totalRelevantCatalogueProducts <= 0) {
    return { status: "unavailable", score: null, evidence };
  }

  const coverage = relevantProductsAvailable / totalRelevantCatalogueProducts;
  const score = clamp((1 - coverage) * 100, 0, 100);
  return { status: "available", score, evidence };
}

/**
 * 20% weight. Uses competitionDensityPerSqKm (not a raw competitor count,
 * which a radius change alone would move) with a simple, explicitly
 * documented-as-arbitrary normalization: 100/(1+density). This is a
 * transparent prototype heuristic, not a researched economic threshold.
 * Withheld (never a real number) when the external mapping provider itself
 * failed -- a genuine provider outage must never read as "low competition."
 */
function computeCompetitionScore(demandSupply) {
  const { competitionDensityPerSqKm, externalProviderStatus, mappedCompetitors } = demandSupply.competition;
  const evidence = { competitionDensityPerSqKm, mappedCompetitors };

  if (externalProviderStatus === "unavailable") {
    return { status: "unavailable", score: null, evidence };
  }

  const score = clamp(100 / (1 + competitionDensityPerSqKm), 0, 100);
  const coverageCaveat =
    mappedCompetitors === 0
      ? "No matching competitors were identified in currently available mapped data; map coverage may still be incomplete."
      : null;

  return { status: "available", score, evidence, coverageCaveat };
}

/**
 * 15% weight. Fit with the configured financing-scheme structure only --
 * never business-startup-cost adequacy, which this project has no verified
 * dataset for. Unlike the other three components this is never withheld:
 * calculateFinancialPlan always returns a definite in-scheme-or-not
 * conclusion for any margin, so "outside both schemes" is a real 0, not a
 * missing measurement.
 */
function computeFinancialFitScore(financialPlan) {
  const evidence = { projectCost: financialPlan.projectCost, fundingGap: financialPlan.fundingGap };

  if (financialPlan.status !== ELIGIBLE_STATUS) {
    return { status: "available", score: 0, evidence: { projectCost: financialPlan.projectCost, fundingGap: null } };
  }

  const score = clamp((1 - financialPlan.fundingGap / financialPlan.projectCost) * 100, 0, 100);
  return { status: "available", score, evidence };
}

const SCORE_STATUS_REASONS = {
  "insufficient-demand-evidence": "Not enough local demand evidence yet.",
  "supply-data-unavailable": "Relevant catalogue coverage is not available for this business category.",
  "competition-data-unavailable": "Competition evidence is temporarily unavailable.",
};

const SUPPLY_COVERAGE_CAVEAT =
  "External businesses may stock relevant products that Kirana Connect cannot observe -- the supply-gap component reflects participating Kirana Connect supply only, not the entire real-world market.";

const UNAVAILABLE_DEMAND = { status: "unavailable", score: null, evidence: { relevantSearches: 0, unmetEvents: 0 } };
const UNAVAILABLE_SUPPLY_GAP = {
  status: "unavailable",
  score: null,
  evidence: { relevantCatalogueProducts: 0, locallyAvailableProducts: 0 },
};
const UNAVAILABLE_COMPETITION = {
  status: "unavailable",
  score: null,
  evidence: { competitionDensityPerSqKm: null, mappedCompetitors: null },
};

/**
 * The Prototype Opportunity Score. Only ever calculated when category-linked
 * demand evidence exists AND all four components produce a real number --
 * a missing component withholds the whole score rather than silently
 * renormalizing the remaining weights over fewer components. See the
 * component functions above for exactly what each 0-100 number means.
 *
 * Whether the FINAL SCORE is withheld and each individual component's own
 * availability are two separate questions -- the gates below that decide
 * `opportunityScore` are unchanged from before, but every component that
 * *can* be computed (financialFit always can; unmetDemand/supplyGap/
 * competition can whenever the demand-supply fetch itself succeeded, even
 * if demand evidence specifically is what's missing) is now always
 * computed and returned in `components`, so the UI can show an honest
 * per-component evidence checklist even when the overall score is
 * withheld. This does not relax which conditions withhold the score.
 */
function computeOpportunity({ demandSupply, financialPlan }) {
  const demandSupplyLoaded = demandSupply?.analysisStatus === "ok";
  const totalRelevantSearches = demandSupplyLoaded ? demandSupply.demand.totalRelevantSearches : 0;
  const evidenceVolume = {
    relevantSearches: totalRelevantSearches,
    demandSampleStatus: demandSampleStatus(totalRelevantSearches),
  };

  // financialFit depends only on financialPlan, never on demandSupply, so
  // it is always real regardless of what follows.
  const financialFit = computeFinancialFitScore(financialPlan);

  // The demand-supply fetch itself didn't succeed (still loading never
  // reaches here -- see FeasibilityAssessment.jsx's own loading branch --
  // or the category has no product-category mapping at all) -- genuinely
  // nothing else can be computed either, since supply/competition also
  // come from this same response.
  if (!demandSupplyLoaded) {
    return {
      opportunityScore: null,
      scoreStatus: "insufficient-demand-evidence",
      scoreStatusReason: SCORE_STATUS_REASONS["insufficient-demand-evidence"],
      components: { unmetDemand: UNAVAILABLE_DEMAND, supplyGap: UNAVAILABLE_SUPPLY_GAP, competition: UNAVAILABLE_COMPETITION, financialFit },
      evidenceVolume,
      caveats: [],
    };
  }

  const unmetDemand = computeUnmetDemandScore(demandSupply);
  const supplyGap = computeSupplyGapScore(demandSupply);
  const competition = computeCompetitionScore(demandSupply);
  const components = { unmetDemand, supplyGap, competition, financialFit };

  // Mandatory gate (non-negotiable): zero category-linked relevant searches
  // withholds the score entirely. Never renormalize the other 60% of
  // weights over demand's absence -- supplyGap/competition/financialFit
  // above are still real, computed values, just not rolled into a score.
  if (totalRelevantSearches <= 0) {
    return {
      opportunityScore: null,
      scoreStatus: "insufficient-demand-evidence",
      scoreStatusReason: SCORE_STATUS_REASONS["insufficient-demand-evidence"],
      components,
      evidenceVolume,
      caveats: [],
    };
  }

  if (supplyGap.score === null) {
    return {
      opportunityScore: null,
      scoreStatus: "supply-data-unavailable",
      scoreStatusReason: SCORE_STATUS_REASONS["supply-data-unavailable"],
      components,
      evidenceVolume,
      caveats: [],
    };
  }
  if (competition.score === null) {
    return {
      opportunityScore: null,
      scoreStatus: "competition-data-unavailable",
      scoreStatusReason: SCORE_STATUS_REASONS["competition-data-unavailable"],
      components,
      evidenceVolume,
      caveats: [],
    };
  }

  const weights = OPPORTUNITY_SCORE_WEIGHTS;
  const withWeight = (component, weight) => ({
    ...component,
    weight: weight * 100,
    weightedContribution: component.score * weight,
  });

  const weightedComponents = {
    unmetDemand: withWeight(unmetDemand, weights.unmetDemand),
    supplyGap: withWeight(supplyGap, weights.supplyGap),
    competition: withWeight(competition, weights.competition),
    financialFit: withWeight(financialFit, weights.financialFit),
  };

  const opportunityScore =
    weightedComponents.unmetDemand.weightedContribution +
    weightedComponents.supplyGap.weightedContribution +
    weightedComponents.competition.weightedContribution +
    weightedComponents.financialFit.weightedContribution;

  const caveats = [SUPPLY_COVERAGE_CAVEAT];
  if (competition.coverageCaveat) caveats.push(competition.coverageCaveat);

  return {
    // Full precision kept here -- rounding to one decimal is a display
    // concern for the UI, not something baked into the stored value.
    opportunityScore,
    scoreStatus: "available",
    scoreStatusReason: null,
    components: weightedComponents,
    evidenceVolume,
    caveats,
  };
}

function buildDemandComponent(demandSupply) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") {
    return { status: "unavailable" };
  }
  if (demandSupply.dataSufficiency === "no-data") {
    return { status: "insufficient-data" };
  }
  return {
    status: "available",
    relevantSearches: demandSupply.demand.totalRelevantSearches,
    unmetDemandEvents: demandSupply.demand.unmetDemandEvents,
    unmetDemandRate: demandSupply.demand.unmetDemandRate,
    explicitProductRequests: demandSupply.explicitProductRequests,
  };
}

function buildSupplyGapComponent(demandSupply, demandComponent) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") {
    return { status: "unavailable" };
  }

  const supply = {
    participatingStores: demandSupply.supply.participatingStores,
    relevantProductsAvailable: demandSupply.supply.relevantProductsAvailable,
    activeListings: demandSupply.supply.activeListings,
  };

  // Supply figures themselves are always shown when available -- only the
  // notion of a "gap" (unmet demand relative to that supply) needs demand
  // data to mean anything.
  if (demandComponent.status !== "available") {
    return { status: "insufficient-demand-data", supply };
  }

  return {
    status: "available",
    supply,
    unmetDemandEvents: demandSupply.demand.unmetDemandEvents,
    totalRelevantSearches: demandSupply.demand.totalRelevantSearches,
  };
}

function buildCompetitionComponent(demandSupply) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") {
    return { status: "unavailable" };
  }

  return {
    status: "available",
    mappedCompetitors: demandSupply.competition.mappedCompetitors,
    kiranaConnectCompetitors: demandSupply.competition.kiranaConnectCompetitors,
    externalCompetitors: demandSupply.competition.externalCompetitors,
    competitionDensityPerSqKm: demandSupply.competition.competitionDensityPerSqKm,
    externalProviderStatus: demandSupply.competition.externalProviderStatus,
  };
}

/**
 * Deliberately narrow: scheme/financial-structure fit only. There is no
 * verified minimum-startup-cost dataset per business category in this
 * project, so this never claims to judge whether the capital is actually
 * *enough* to run the business -- only whether it fits the two configured
 * financing schemes.
 */
function buildCapitalComponent(financialPlan) {
  if (financialPlan.status === ELIGIBLE_STATUS) {
    return {
      status: "within-configured-scheme",
      scheme: financialPlan.scheme.name,
      eligibleLoan: financialPlan.eligibleLoan,
      fundingGap: financialPlan.fundingGap,
    };
  }
  return { status: "outside-configured-scheme", scheme: null, eligibleLoan: null, fundingGap: null };
}

/**
 * "assessable" requires demand, supply and competition to all carry real
 * computed evidence (not "unavailable"/"insufficient-data" placeholders).
 * Capital suitability does not gate this: calculateFinancialPlan always
 * returns a real, definitive conclusion (in-scheme or not) for any margin,
 * so it never blocks the report the way missing search history does.
 */
function determineAssessmentStatus({ demandSupplyStatus, demandComponent }) {
  if (demandSupplyStatus !== "loaded") return "insufficient-data";
  if (demandComponent.status === "unavailable") return "insufficient-data";
  if (demandComponent.status === "insufficient-data") return "partially-assessable";
  return "assessable";
}

function buildConclusions({ demandComponent, supplyGapComponent, competitionComponent, capitalComponent }) {
  const conclusions = [];

  if (supplyGapComponent.status !== "unavailable" && supplyGapComponent.supply.participatingStores > 0) {
    conclusions.push("Participating Kirana Connect supply exists in the selected area.");
  }

  if (demandComponent.status === "insufficient-data") {
    conclusions.push("Current Consumer search history is insufficient for a demand conclusion.");
  } else if (demandComponent.status === "available") {
    conclusions.push(
      `${demandComponent.unmetDemandEvents} of ${demandComponent.relevantSearches} relevant local searches showed unmet demand in the analysis period.`,
    );
  }

  if (competitionComponent.status === "available") {
    conclusions.push(
      competitionComponent.mappedCompetitors === 0
        ? "No matching external competitors were identified in mapped data, but local map coverage may be incomplete."
        : `${competitionComponent.mappedCompetitors} mapped competitor${competitionComponent.mappedCompetitors === 1 ? " was" : "s were"} identified within the selected radius.`,
    );
  }

  conclusions.push(
    capitalComponent.status === "within-configured-scheme"
      ? `The entered margin capital fits within the configured ${capitalComponent.scheme} range.`
      : "The entered margin capital falls outside the two currently configured financing schemes.",
  );

  return conclusions;
}

function buildMissingData({ demandComponent, competitionComponent }) {
  const missing = [];

  if (demandComponent.status !== "available") missing.push("More local Consumer search activity");
  if (
    competitionComponent.status === "unavailable" ||
    (competitionComponent.status === "available" && competitionComponent.externalCompetitors === 0)
  ) {
    missing.push("Better external competitor coverage");
  }
  // Both of these are structurally true for every report right now: no
  // population provider is configured (see population.service.js), and
  // capital suitability never had real per-category startup-cost data.
  missing.push("Population/demographic source");
  missing.push("Actual operating-cost estimates");

  return missing;
}

/**
 * demandSupplyState: the useDemandSupply() hook's state, {status, data?}.
 * financialPlan: calculateFinancialPlan()'s return value.
 */
export function calculateFeasibilityAssessment({ demandSupplyState, financialPlan }) {
  const demandSupply = demandSupplyState?.status === "loaded" ? demandSupplyState.data : null;

  const demand = buildDemandComponent(demandSupply);
  const supplyGap = buildSupplyGapComponent(demandSupply, demand);
  const competition = buildCompetitionComponent(demandSupply);
  const capital = buildCapitalComponent(financialPlan);

  const status = determineAssessmentStatus({ demandSupplyStatus: demandSupplyState?.status, demandComponent: demand });
  const opportunity = computeOpportunity({ demandSupply, financialPlan });

  return {
    status,
    components: { demand, supplyGap, competition, capital },
    opportunity,
    conclusions: buildConclusions({ demandComponent: demand, supplyGapComponent: supplyGap, competitionComponent: competition, capitalComponent: capital }),
    missingData: buildMissingData({ demandComponent: demand, competitionComponent: competition }),
  };
}
