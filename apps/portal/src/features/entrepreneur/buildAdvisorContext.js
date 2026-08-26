import { ELIGIBLE_STATUS } from "./financialEngine.js";
import { calculateRepaymentPlan, AVAILABLE_STATUS as REPAYMENT_AVAILABLE } from "./repaymentEngine.js";
import { calculateFeasibilityAssessment } from "./feasibilityEngine.js";

/**
 * Builds the compact, structured context sent to the AI Business Advisor.
 * Pure and deterministic -- no network calls of its own; every figure comes
 * from state EntrepreneurAnalysis.jsx already computed or fetched once. The
 * financial and repayment recalculations here are cheap, side-effect-free
 * re-runs of the same pure engines the report itself uses (not a duplicate
 * network request), so the advisor can never see a stale number.
 *
 * Deliberately narrow: this must never grow into "send the whole report
 * state." Large arrays (price rows, unmet queries) are pre-summarized to a
 * handful of top entries -- see the *_LIMIT constants below -- and the
 * server independently re-validates and whitelists every field again (see
 * validateAdvisorContext.js) before anything reaches the AI provider.
 */

const TOP_UNMET_QUERIES_LIMIT = 5;
const TOP_PRICE_PRODUCTS_LIMIT = 8;
const EVIDENCE_ITEMS_LIMIT = 6;

function summarizeFinancial(plan) {
  if (plan.status !== ELIGIBLE_STATUS) {
    return { status: plan.status, projectCost: plan.projectCost };
  }
  return {
    status: plan.status,
    projectCost: plan.projectCost,
    scheme: plan.scheme.name,
    eligibleLoan: plan.eligibleLoan,
    agencySharePercentage: plan.agencySharePercentage,
    fundingGap: plan.fundingGap,
    interestRateAnnual: plan.scheme.interestRateAnnual,
    tenureYears: plan.scheme.tenureYears,
    moratoriumMonths: plan.scheme.moratoriumMonths,
  };
}

function summarizeRepayment(repayment) {
  if (repayment.status !== REPAYMENT_AVAILABLE) return { status: "not-applicable" };
  return {
    status: repayment.status,
    assumptionCode: repayment.assumption.code,
    quarterlyInterestRate: repayment.quarterlyInterestRate,
    totalQuarters: repayment.totalQuarters,
    moratoriumQuarters: repayment.moratoriumQuarters,
    repaymentQuarters: repayment.repaymentQuarters,
    balanceAfterMoratorium: repayment.balanceAfterMoratorium,
    regularQuarterlyPayment: repayment.regularQuarterlyPayment,
    totalInterest: repayment.totalInterest,
    totalRepayment: repayment.totalRepayment,
  };
}

function summarizeDemandSupply(demandSupplyState) {
  if (demandSupplyState?.status !== "loaded") return { status: "unloaded" };
  const d = demandSupplyState.data;
  if (d.analysisStatus !== "ok") return { status: d.analysisStatus };

  return {
    status: "ok",
    dataSufficiency: d.dataSufficiency,
    periodDays: d.period.days,
    totalRelevantSearches: d.demand.totalRelevantSearches,
    unmetDemandEvents: d.demand.unmetDemandEvents,
    unmetDemandRate: d.demand.unmetDemandRate,
    explicitProductRequests: d.explicitProductRequests,
    topUnmetQueries: d.topUnmetQueries.slice(0, TOP_UNMET_QUERIES_LIMIT).map((q) => ({
      query: q.query,
      searches: q.searches,
      unmetSearches: q.unmetSearches,
    })),
    participatingStores: d.supply.participatingStores,
    relevantProductsAvailable: d.supply.relevantProductsAvailable,
    activeListings: d.supply.activeListings,
  };
}

function summarizeCompetition(demandSupplyState) {
  if (demandSupplyState?.status !== "loaded") return { status: "unloaded" };
  const d = demandSupplyState.data;
  if (d.analysisStatus !== "ok") return { status: "unloaded" };

  return {
    status: "ok",
    mappedCompetitors: d.competition.mappedCompetitors,
    kiranaConnectCompetitors: d.competition.kiranaConnectCompetitors,
    externalCompetitors: d.competition.externalCompetitors,
    competitionDensityPerSqKm: d.competition.competitionDensityPerSqKm,
    externalProviderStatus: d.competition.externalProviderStatus,
  };
}

function summarizeMarketReach(marketReachState) {
  if (marketReachState?.status !== "loaded") return { status: "unloaded" };
  const m = marketReachState.data;

  return {
    status: "ok",
    marketAreaSqKm: m.marketAreaSqKm,
    populationStatus: m.population.status,
    populationEstimate: m.population.status === "available" ? m.population.estimatedPopulation : null,
    distributionChannels: m.distributionChannels ?? [],
  };
}

function summarizePriceIntelligence(priceIntelligenceState) {
  if (priceIntelligenceState?.status !== "loaded") return { status: "unloaded" };
  const p = priceIntelligenceState.data;
  if (p.analysisStatus !== "ok") return { status: p.analysisStatus };

  return {
    status: "ok",
    dataSufficiency: p.dataSufficiency,
    productsWithObservations: p.summary.productsWithObservations,
    listingsAnalyzed: p.summary.listingsAnalyzed,
    storesRepresented: p.summary.storesRepresented,
    topProducts: p.products.slice(0, TOP_PRICE_PRODUCTS_LIMIT).map((pr) => ({
      productName: pr.productName,
      variantLabel: pr.variantLabel,
      minPrice: pr.minPrice,
      maxPrice: pr.maxPrice,
      medianPrice: pr.medianPrice,
      observations: pr.observations,
    })),
  };
}

function summarizeEvidenceList(items) {
  return items.slice(0, EVIDENCE_ITEMS_LIMIT).map(({ title, evidence }) => ({ title, evidence }));
}

/**
 * The Prototype Opportunity Score, already fully computed by
 * feasibilityEngine.js -- the advisor only ever explains this, never
 * recalculates it (see GROUNDING RULE 15 in advisor.service.js).
 */
function summarizeOpportunity(opportunity) {
  if (opportunity.scoreStatus !== "available") {
    return { scoreStatus: opportunity.scoreStatus, scoreStatusReason: opportunity.scoreStatusReason };
  }

  const componentSummary = (c) => ({ score: c.score, weight: c.weight, weightedContribution: c.weightedContribution });

  return {
    scoreStatus: opportunity.scoreStatus,
    opportunityScore: opportunity.opportunityScore,
    components: {
      unmetDemand: componentSummary(opportunity.components.unmetDemand),
      supplyGap: componentSummary(opportunity.components.supplyGap),
      competition: componentSummary(opportunity.components.competition),
      financialFit: componentSummary(opportunity.components.financialFit),
    },
    evidenceVolume: opportunity.evidenceVolume,
    caveats: opportunity.caveats,
  };
}

export function buildAdvisorContext({
  location,
  businessCategory,
  radiusKm,
  availableMargin,
  financialPlan,
  demandSupplyState,
  marketReachState,
  priceIntelligenceState,
  threats,
  unassessableRisks,
  swot,
}) {
  const repayment = calculateRepaymentPlan(financialPlan);
  const feasibility = calculateFeasibilityAssessment({ demandSupplyState, financialPlan });

  return {
    entrepreneurInput: {
      location: location?.label ?? location?.query ?? null,
      businessCategory: businessCategory?.name ?? null,
      radiusKm,
      availableMargin,
    },
    financial: summarizeFinancial(financialPlan),
    repayment: summarizeRepayment(repayment),
    demandSupply: summarizeDemandSupply(demandSupplyState),
    competition: summarizeCompetition(demandSupplyState),
    marketReach: summarizeMarketReach(marketReachState),
    priceIntelligence: summarizePriceIntelligence(priceIntelligenceState),
    feasibility: {
      status: feasibility.status,
      conclusions: feasibility.conclusions,
      missingData: feasibility.missingData,
    },
    opportunity: summarizeOpportunity(feasibility.opportunity),
    risks: {
      threats: summarizeEvidenceList(threats),
      unassessableRisks: unassessableRisks.map((r) => ({ reason: r.reason })),
    },
    swot: {
      strengths: summarizeEvidenceList(swot.strengths),
      weaknesses: summarizeEvidenceList(swot.weaknesses),
      opportunities: summarizeEvidenceList(swot.opportunities),
      threats: summarizeEvidenceList(swot.threats),
    },
  };
}
