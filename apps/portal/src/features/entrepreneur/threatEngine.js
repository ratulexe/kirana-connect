import { ELIGIBLE_STATUS } from "./financialEngine.js";

/**
 * Threat Identification (Module 9). Pure and deterministic, no AI -- every
 * entry is derived from a structured condition on real, already-fetched
 * data. No severity rating is attached to any threat: this project has no
 * documented, defensible methodology for turning these facts into a
 * Low/Medium/High classification yet, so severity stays null rather than
 * being invented.
 *
 * A threat is evidence worth planning around. An "unassessable risk" is a
 * DIFFERENT thing: a real business risk category (supplier dependency,
 * seasonality, purchasing power) this project has no data for at all --
 * listing it as a threat with fabricated evidence would be worse than
 * naming it as a gap.
 */

// Meaningful sample + a genuinely tight spread, both required before a
// price pattern is called out at all -- one or two listings a few paise
// apart is noise, not a documented local pattern. Capped so this can't
// flood the list; documented here since the spec asks for exactly this.
const PRICE_CONVERGENCE_MIN_OBSERVATIONS = 4;
const PRICE_CONVERGENCE_MAX_SPREAD_RATIO = 0.1; // spread <= 10% of the median
const PRICE_CONVERGENCE_MAX_ITEMS = 3;

function competitionThreat(demandSupply) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") return null;

  const { mappedCompetitors, externalCompetitors } = demandSupply.competition;
  const evidence =
    mappedCompetitors > 0
      ? `${mappedCompetitors} mapped competitor${mappedCompetitors === 1 ? "" : "s"} identified within ${demandSupply.radiusKm} km.`
      : "No mapped competitors identified, but OpenStreetMap coverage is incomplete.";

  return {
    code: "competition-pressure",
    title: "Competition pressure",
    evidence:
      externalCompetitors === 0
        ? `${evidence} External map coverage in this area may not reflect every real competitor.`
        : evidence,
    severity: null,
  };
}

function externalCoverageThreat(demandSupply) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") return null;
  if (demandSupply.competition.externalProviderStatus !== "unavailable") return null;

  return {
    code: "external-coverage-uncertainty",
    title: "External map coverage uncertainty",
    evidence: "External mapped business data was temporarily unavailable when this analysis was run.",
    severity: null,
  };
}

function demandUncertaintyThreat(demandSupply) {
  if (!demandSupply || demandSupply.analysisStatus !== "ok") return null;
  if (demandSupply.dataSufficiency !== "no-data") return null;

  return {
    code: "demand-uncertainty",
    title: "Demand uncertainty",
    evidence: "Insufficient local Consumer search history is available to confirm demand patterns.",
    severity: null,
  };
}

function priceConvergenceThreats(priceIntelligence) {
  if (!priceIntelligence || priceIntelligence.analysisStatus !== "ok") return [];

  return (priceIntelligence.products ?? [])
    .filter((p) => p.observations >= PRICE_CONVERGENCE_MIN_OBSERVATIONS && p.medianPrice > 0)
    .filter((p) => p.localPriceSpread / p.medianPrice <= PRICE_CONVERGENCE_MAX_SPREAD_RATIO)
    .slice(0, PRICE_CONVERGENCE_MAX_ITEMS)
    .map((p) => ({
      code: `price-convergence-${p.productVariantId}`,
      title: "Strong local price convergence",
      evidence: `${p.observations} stores sell ${p.productName} (${p.variantLabel}) between ₹${p.minPrice} and ₹${p.maxPrice} -- limited room for price differentiation on this item.`,
      severity: null,
    }));
}

function financialThreats(financialPlan) {
  const threats = [];

  if (financialPlan.status !== ELIGIBLE_STATUS) {
    threats.push({
      code: "scheme-mismatch",
      title: "Configured scheme mismatch",
      evidence: `The indicative project cost of ₹${financialPlan.projectCost.toLocaleString("en-IN")} falls outside the two currently configured financing schemes.`,
      severity: null,
    });
  } else if (financialPlan.fundingGap > 0) {
    threats.push({
      code: "funding-gap",
      title: "Funding gap",
      evidence: `A funding gap of ₹${financialPlan.fundingGap.toLocaleString("en-IN")} remains after eligible agency finance under the ${financialPlan.scheme.name}.`,
      severity: null,
    });
  }

  return threats;
}

/** Risk categories this project has no data source for at all, regardless of location or category. */
function unassessableRisks() {
  return [
    {
      code: "supplier-dependency",
      reason: "Supplier-source data is not currently available.",
    },
    {
      code: "seasonality",
      reason: "Insufficient multi-period Consumer search history is available to assess seasonal demand patterns.",
    },
    {
      code: "household-purchasing-power",
      reason: "A verified local household purchasing-power dataset is not currently available.",
    },
  ];
}

export function identifyBusinessThreats({ demandSupplyState, financialPlan, priceIntelligenceState }) {
  const demandSupply = demandSupplyState?.status === "loaded" ? demandSupplyState.data : null;
  const priceIntelligence = priceIntelligenceState?.status === "loaded" ? priceIntelligenceState.data : null;

  const threats = [
    competitionThreat(demandSupply),
    externalCoverageThreat(demandSupply),
    demandUncertaintyThreat(demandSupply),
    ...priceConvergenceThreats(priceIntelligence),
    ...financialThreats(financialPlan),
  ].filter(Boolean);

  return { threats, unassessableRisks: unassessableRisks() };
}
