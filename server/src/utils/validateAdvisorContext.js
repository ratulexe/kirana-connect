import { badRequest } from "./httpError.js";

/**
 * Whitelist validator for the advisor's reportContext payload. The Portal
 * builds this object client-side from data it already fetched (see
 * apps/portal/src/features/entrepreneur/buildAdvisorContext.js) -- but it is
 * still untrusted network input, so nothing here is passed to the AI
 * provider without being explicitly picked, type-checked, length-capped and
 * re-shaped first. Unknown fields are silently dropped, never forwarded.
 */

function str(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function oneOf(value, allowed) {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function list(value, mapItem, maxItems) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(mapItem).filter(Boolean);
}

function section(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function pickEntrepreneurInput(raw) {
  const s = section(raw);
  return {
    location: str(s.location, 160),
    businessCategory: str(s.businessCategory, 80),
    radiusKm: num(s.radiusKm),
    availableMargin: num(s.availableMargin),
  };
}

function pickFinancial(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["eligible", "outside-configured-scheme-limit"]),
    projectCost: num(s.projectCost),
    scheme: str(s.scheme, 60),
    eligibleLoan: num(s.eligibleLoan),
    agencySharePercentage: num(s.agencySharePercentage),
    fundingGap: num(s.fundingGap),
    interestRateAnnual: num(s.interestRateAnnual),
    tenureYears: num(s.tenureYears),
    moratoriumMonths: num(s.moratoriumMonths),
  };
}

function pickRepayment(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["available", "not-applicable"]),
    assumptionCode: str(s.assumptionCode, 80),
    quarterlyInterestRate: num(s.quarterlyInterestRate),
    totalQuarters: num(s.totalQuarters),
    moratoriumQuarters: num(s.moratoriumQuarters),
    repaymentQuarters: num(s.repaymentQuarters),
    balanceAfterMoratorium: num(s.balanceAfterMoratorium),
    regularQuarterlyPayment: num(s.regularQuarterlyPayment),
    totalInterest: num(s.totalInterest),
    totalRepayment: num(s.totalRepayment),
  };
}

function pickDemandSupply(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["ok", "category-mapping-unavailable", "unloaded"]),
    dataSufficiency: oneOf(s.dataSufficiency, ["available", "no-data"]),
    periodDays: num(s.periodDays),
    totalRelevantSearches: num(s.totalRelevantSearches),
    unmetDemandEvents: num(s.unmetDemandEvents),
    unmetDemandRate: num(s.unmetDemandRate),
    explicitProductRequests: num(s.explicitProductRequests),
    topUnmetQueries: list(
      s.topUnmetQueries,
      (q) => {
        const query = str(q?.query, 100);
        if (!query) return null;
        return { query, searches: num(q.searches) ?? 0, unmetSearches: num(q.unmetSearches) ?? 0 };
      },
      5,
    ),
    participatingStores: num(s.participatingStores),
    relevantProductsAvailable: num(s.relevantProductsAvailable),
    activeListings: num(s.activeListings),
  };
}

function pickCompetition(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["ok", "unloaded"]),
    mappedCompetitors: num(s.mappedCompetitors),
    kiranaConnectCompetitors: num(s.kiranaConnectCompetitors),
    externalCompetitors: num(s.externalCompetitors),
    competitionDensityPerSqKm: num(s.competitionDensityPerSqKm),
    externalProviderStatus: oneOf(s.externalProviderStatus, ["ok", "unavailable"]),
  };
}

function pickMarketReach(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["ok", "unloaded"]),
    marketAreaSqKm: num(s.marketAreaSqKm),
    populationStatus: oneOf(s.populationStatus, ["available", "unavailable"]),
    populationEstimate: num(s.populationEstimate),
    distributionChannels: list(s.distributionChannels, (c) => str(c, 80), 5),
  };
}

function pickPriceIntelligence(raw) {
  const s = section(raw);
  return {
    status: oneOf(s.status, ["ok", "category-mapping-unavailable", "unloaded"]),
    dataSufficiency: oneOf(s.dataSufficiency, ["available", "limited-price-data", "no-price-data"]),
    productsWithObservations: num(s.productsWithObservations),
    listingsAnalyzed: num(s.listingsAnalyzed),
    storesRepresented: num(s.storesRepresented),
    topProducts: list(
      s.topProducts,
      (p) => {
        const productName = str(p?.productName, 100);
        if (!productName) return null;
        return {
          productName,
          variantLabel: str(p.variantLabel, 40) ?? "",
          minPrice: num(p.minPrice),
          maxPrice: num(p.maxPrice),
          medianPrice: num(p.medianPrice),
          observations: num(p.observations) ?? 0,
        };
      },
      8,
    ),
  };
}

function pickEvidenceItems(raw, maxItems) {
  return list(
    raw,
    (item) => {
      const title = str(item?.title, 100);
      const evidence = str(item?.evidence, 300);
      if (!title || !evidence) return null;
      return { title, evidence };
    },
    maxItems,
  );
}

function pickFeasibility(raw) {
  const s = section(raw);
  return {
    status: str(s.status, 60),
    conclusions: list(s.conclusions, (c) => str(c, 200), 6),
    missingData: list(s.missingData, (m) => str(m, 120), 6),
  };
}

function pickRisks(raw) {
  const s = section(raw);
  return {
    threats: pickEvidenceItems(s.threats, 8),
    unassessableRisks: list(s.unassessableRisks, (r) => str(r?.reason, 200), 5),
  };
}

const OPPORTUNITY_STATUS_VALUES = [
  "available",
  "insufficient-demand-evidence",
  "supply-data-unavailable",
  "competition-data-unavailable",
];
const DEMAND_SAMPLE_STATUS_VALUES = ["no-data", "very-limited", "limited", "developing"];

function pickOpportunityComponent(raw) {
  const s = section(raw);
  return { score: num(s.score), weight: num(s.weight), weightedContribution: num(s.weightedContribution) };
}

/**
 * The Prototype Opportunity Score is fully computed client-side in
 * feasibilityEngine.js -- this whitelist exists so the advisor can quote
 * it, never so it can be recalculated server-side (there is no formula
 * here, only field picking, exactly like every other section in this file).
 */
function pickOpportunity(raw) {
  const s = section(raw);
  const scoreStatus = oneOf(s.scoreStatus, OPPORTUNITY_STATUS_VALUES);

  if (scoreStatus !== "available") {
    return { scoreStatus, scoreStatusReason: str(s.scoreStatusReason, 300) };
  }

  const opportunityScore = num(s.opportunityScore);
  const components = {
    unmetDemand: pickOpportunityComponent(s.components?.unmetDemand),
    supplyGap: pickOpportunityComponent(s.components?.supplyGap),
    competition: pickOpportunityComponent(s.components?.competition),
    financialFit: pickOpportunityComponent(s.components?.financialFit),
  };
  const evidenceVolume = {
    relevantSearches: num(s.evidenceVolume?.relevantSearches),
    demandSampleStatus: oneOf(s.evidenceVolume?.demandSampleStatus, DEMAND_SAMPLE_STATUS_VALUES),
  };

  // This endpoint has no auth gate (the Business Portal is intentionally
  // open), so reportContext is untrusted input from anyone, not just the
  // real frontend -- a caller claiming scoreStatus "available" without the
  // numbers to back it must not reach advisor.service.js's formatter, which
  // assumes every field here is a real number and calls .toFixed() on it.
  // Downgrading to the same shape as "insufficient evidence" here is the
  // one place that protects every current and future consumer of this
  // whitelist at once.
  const allNumbersPresent =
    opportunityScore !== null &&
    Object.values(components).every(
      (c) => c.score !== null && c.weight !== null && c.weightedContribution !== null,
    ) &&
    evidenceVolume.relevantSearches !== null;

  if (!allNumbersPresent) {
    return { scoreStatus: "insufficient-demand-evidence", scoreStatusReason: null };
  }

  return {
    scoreStatus,
    opportunityScore,
    components,
    evidenceVolume,
    caveats: list(s.caveats, (c) => str(c, 300), 5),
  };
}

function pickSwot(raw) {
  const s = section(raw);
  return {
    strengths: pickEvidenceItems(s.strengths, 6),
    weaknesses: pickEvidenceItems(s.weaknesses, 6),
    opportunities: pickEvidenceItems(s.opportunities, 6),
    threats: pickEvidenceItems(s.threats, 6),
  };
}

export function validateAdvisorReportContext(raw) {
  const s = section(raw);
  return {
    entrepreneurInput: pickEntrepreneurInput(s.entrepreneurInput),
    financial: pickFinancial(s.financial),
    repayment: pickRepayment(s.repayment),
    demandSupply: pickDemandSupply(s.demandSupply),
    competition: pickCompetition(s.competition),
    marketReach: pickMarketReach(s.marketReach),
    priceIntelligence: pickPriceIntelligence(s.priceIntelligence),
    feasibility: pickFeasibility(s.feasibility),
    opportunity: pickOpportunity(s.opportunity),
    risks: pickRisks(s.risks),
    swot: pickSwot(s.swot),
  };
}

const SUPPORTED_LANGUAGES = ["en", "bn", "hi"];
const QUESTION_MAX_LENGTH = 2000;
const MESSAGE_MAX_LENGTH = 2000;
const RECENT_MESSAGES_MAX = 10;

function validateRecentMessages(raw) {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw badRequest("recentMessages must be an array.");

  return raw.slice(-RECENT_MESSAGES_MAX).map((m) => {
    const role = oneOf(m?.role, ["user", "assistant"]);
    const content = str(m?.content, MESSAGE_MAX_LENGTH);
    if (!role || !content) throw badRequest("Each recent message needs a valid role and content.");
    return { role, content };
  });
}

/**
 * Full request-body validator for POST /api/entrepreneur/advisor. question
 * and recentMessages are the only user-authored free text sent to the
 * model; reportContext is whitelisted above so nothing beyond the known
 * report shape ever reaches the provider.
 */
export function validateAdvisorRequest(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("An advisor request payload is required.");
  }

  const language = oneOf(body.language, SUPPORTED_LANGUAGES);
  if (!language) throw badRequest("language must be one of: en, bn, hi.");

  const question = str(body.question, QUESTION_MAX_LENGTH);
  if (!question) throw badRequest("question is required.");
  if (typeof body.question === "string" && body.question.trim().length > QUESTION_MAX_LENGTH) {
    throw badRequest(`question must be at most ${QUESTION_MAX_LENGTH} characters.`);
  }

  return {
    language,
    question,
    reportContext: validateAdvisorReportContext(body.reportContext),
    recentMessages: validateRecentMessages(body.recentMessages),
  };
}
