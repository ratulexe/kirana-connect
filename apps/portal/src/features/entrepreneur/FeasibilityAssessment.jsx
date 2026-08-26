import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Gauge,
  IndianRupee,
  Info,
  ListTree,
  Search,
  Store,
  Target,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadingInsight from "../../components/common/LoadingInsight.jsx";
import { calculateFeasibilityAssessment, OPPORTUNITY_SCORE_WEIGHTS } from "./feasibilityEngine.js";
import { formatPrice } from "../../utils/format.js";

const COMPONENT_ROWS = [
  { key: "unmetDemand", label: "Unmet Demand" },
  { key: "supplyGap", label: "Supply Gap" },
  { key: "competition", label: "Competition" },
  { key: "financialFit", label: "Financial Fit" },
];

const CHECKLIST_ROWS = [
  { key: "unmetDemand", label: "Observed Demand", icon: Search },
  { key: "supplyGap", label: "Participating Supply Gap", icon: ListTree },
  { key: "competition", label: "Mapped Competition", icon: Store },
  { key: "financialFit", label: "Financial Fit", icon: IndianRupee },
];

const DEMAND_SAMPLE_LABELS = {
  "no-data": "No data",
  "very-limited": "Very limited",
  limited: "Limited",
  developing: "Developing",
};

/**
 * Real evidence sentences per component, for the unavailable-state
 * checklist -- every string here reflects an actual computed value or a
 * genuine absence, never a placeholder. Matches feasibilityEngine.js's own
 * per-component "unavailable" reasons so the checklist can never disagree
 * with why the overall score is withheld.
 */
function demandEvidenceText(unmetDemand) {
  if (unmetDemand.status !== "available") {
    return "No category-linked Consumer searches have been recorded within this radius.";
  }
  const n = unmetDemand.evidence.relevantSearches;
  return `${n} category-linked Consumer search${n === 1 ? "" : "es"} recorded within this radius and analysis period.`;
}

function supplyGapEvidenceText(supplyGap) {
  if (supplyGap.status !== "available") {
    return "Relevant catalogue coverage is not available for this business category.";
  }
  const { locallyAvailableProducts, relevantCatalogueProducts } = supplyGap.evidence;
  return `${locallyAvailableProducts} of ${relevantCatalogueProducts} relevant catalogue products are currently visible locally.`;
}

function competitionEvidenceText(competition) {
  if (competition.status !== "available") {
    return "Competition evidence is temporarily unavailable.";
  }
  const n = competition.evidence.mappedCompetitors;
  return `${n} mapped competitor${n === 1 ? " was" : "s were"} identified in the current analysis.`;
}

function financialFitEvidenceText(financialPlan) {
  return financialPlan.status === "eligible"
    ? `The current project structure matches the configured ${financialPlan.scheme.name}.`
    : "The current project cost falls outside the two configured scheme ranges.";
}

function checklistEvidence(key, opportunity, financialPlan) {
  switch (key) {
    case "unmetDemand":
      return demandEvidenceText(opportunity.components.unmetDemand);
    case "supplyGap":
      return supplyGapEvidenceText(opportunity.components.supplyGap);
    case "competition":
      return competitionEvidenceText(opportunity.components.competition);
    case "financialFit":
      return financialFitEvidenceText(financialPlan);
    default:
      return "";
  }
}

const STATUS_LABEL = {
  "insufficient-data": "Insufficient data",
  "partially-assessable": "Partial data",
  assessable: "Assessable",
};

const STATUS_EXPLANATION = {
  "insufficient-data": "Critical data (demand analysis) is not currently available, so this location and category cannot yet be meaningfully assessed.",
  "partially-assessable": "Financial and participating-supply information is available, but insufficient local search activity has been recorded to calculate a reliable demand-based conclusion.",
};

/**
 * "assessable" alone doesn't say whether the Opportunity Score itself came
 * through -- determineAssessmentStatus only checks demand, while the score
 * can still be separately withheld by a supply or competition data gap
 * (see feasibilityEngine.js's computeOpportunity). Text here must not claim
 * the score is calculated when it isn't, or withheld when it is.
 */
function assessableExplanation(scoreStatus) {
  return scoreStatus === "available"
    ? "All four evidence components have real, computed data -- see the Prototype Opportunity Score below."
    : "All four evidence components have real, computed data. A single numeric score is still withheld -- see below.";
}

function ComponentCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-2 text-body text-ink">{children}</div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <p className="text-meta text-ink-soft">
      {label}: <span className="font-semibold text-ink tabular-nums">{value}</span>
    </p>
  );
}

function DemandCard({ demand }) {
  if (demand.status === "unavailable") {
    return <p className="text-meta text-ink-muted">Not available for this business category yet.</p>;
  }
  if (demand.status === "insufficient-data") {
    return <p className="text-meta text-ink-muted">Not enough recorded search activity.</p>;
  }
  return (
    <div className="grid gap-1">
      <Fact label="Relevant searches" value={demand.relevantSearches} />
      <Fact label="Unmet search events" value={demand.unmetDemandEvents} />
      <Fact label="Unmet demand rate" value={`${Math.round(demand.unmetDemandRate * 1000) / 10}%`} />
      <Fact label="Explicit product requests" value={demand.explicitProductRequests} />
    </div>
  );
}

function SupplyGapCard({ supplyGap }) {
  if (supplyGap.status === "unavailable") {
    return <p className="text-meta text-ink-muted">Not available for this business category yet.</p>;
  }
  return (
    <div className="grid gap-1">
      <Fact label="Participating stores" value={supplyGap.supply.participatingStores} />
      <Fact label="Relevant products" value={supplyGap.supply.relevantProductsAvailable} />
      <Fact label="Active listings" value={supplyGap.supply.activeListings} />
      {supplyGap.status === "insufficient-demand-data" ? (
        <p className="mt-1 text-meta text-ink-muted">
          Insufficient demand data to calculate an unmet-demand gap against this supply.
        </p>
      ) : (
        <Fact label="Unmet vs. relevant searches" value={`${supplyGap.unmetDemandEvents} of ${supplyGap.totalRelevantSearches}`} />
      )}
    </div>
  );
}

function CompetitionCard({ competition }) {
  if (competition.status === "unavailable") {
    return <p className="text-meta text-ink-muted">Not available for this business category yet.</p>;
  }
  return (
    <div className="grid gap-1">
      <Fact label="Mapped competitors" value={competition.mappedCompetitors} />
      <Fact label="Kirana Connect" value={competition.kiranaConnectCompetitors} />
      <Fact label="External (OpenStreetMap)" value={competition.externalCompetitors} />
      <Fact label="Density" value={`${competition.competitionDensityPerSqKm.toFixed(2)} / km²`} />
      <p className="mt-1 text-meta text-ink-muted">
        {competition.externalProviderStatus === "unavailable"
          ? "External mapped data was temporarily unavailable when this was calculated."
          : "External map coverage may be incomplete, especially for smaller settlements."}
      </p>
    </div>
  );
}

function CapitalCard({ capital }) {
  if (capital.status === "within-configured-scheme") {
    return (
      <div className="grid gap-1">
        <Fact label="Scheme match" value={capital.scheme} />
        <Fact label="Eligible agency finance" value={formatPrice(capital.eligibleLoan)} />
        {capital.fundingGap > 0 ? <Fact label="Funding gap" value={formatPrice(capital.fundingGap)} /> : null}
        <p className="mt-1 text-meta text-ink-muted">
          Reflects scheme/financial-structure fit only, not full business-cost adequacy.
        </p>
      </div>
    );
  }
  return (
    <p className="text-meta text-ink-muted">
      The indicative project size falls outside the two currently configured financing schemes.
    </p>
  );
}

function EvidenceVolumeLine({ demandSupply, financialPlan, demandSampleStatus }) {
  const supply = demandSupply?.supply;
  const competition = demandSupply?.competition;

  return (
    <div className="mt-3 grid gap-1">
      <Fact label="Relevant Consumer searches" value={demandSupply?.demand?.totalRelevantSearches ?? "—"} />
      <Fact
        label="Participating supply"
        value={
          supply
            ? `${supply.relevantProductsAvailable} / ${supply.totalRelevantCatalogueProducts ?? "—"} relevant catalogue products`
            : "—"
        }
      />
      <Fact label="Mapped competitors" value={competition?.mappedCompetitors ?? "—"} />
      <Fact
        label="Financial scheme status"
        value={financialPlan.status === "eligible" ? "matched" : "outside configured schemes"}
      />
      {/* Surfaced here, not only inside the collapsed methodology note, per
          this milestone's explicit instruction that a small-sample score not
          be misread as under-the-hood confidence. */}
      <p className="mt-1 text-meta text-ink-muted">
        Sample: <span className="font-semibold text-ink-soft">{DEMAND_SAMPLE_LABELS[demandSampleStatus]}</span> --
        this label describes the amount of observed activity, not a statistical confidence rating.
      </p>
    </div>
  );
}

function ScoreBreakdownRow({ label, component }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-control border border-line-soft bg-surface px-3.5 py-2.5">
      <span className="text-meta font-semibold text-ink">{label}</span>
      <span className="text-meta tabular-nums text-ink-soft">
        {component.score.toFixed(1)} &times; {component.weight}%{" "}
        <span className="text-ink-muted">(contributes {component.weightedContribution.toFixed(1)})</span>
      </span>
    </div>
  );
}

/**
 * One evidence-checklist row: real Available/Unavailable text (never color
 * alone -- an icon and the word itself both carry the state) plus the
 * actual evidence sentence behind it. The Observed Demand row additionally
 * surfaces the sample-size label right here, not only inside the collapsed
 * methodology note, per this milestone's explicit instruction that it not
 * be hidden in technical text alone.
 */
function EvidenceChecklistRow({ icon: Icon, label, available, evidence, sampleLabel }) {
  return (
    <div className="rounded-control border border-line-soft bg-surface px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-meta font-semibold text-ink">
          <Icon className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          {label}
        </span>
        <span className={`flex items-center gap-1.5 text-meta font-semibold ${available ? "text-success" : "text-ink-muted"}`}>
          {available ? (
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          {available ? "Available" : "Unavailable"}
        </span>
      </div>
      <p className="mt-1.5 text-meta text-ink-soft">{evidence}</p>
      {sampleLabel ? (
        <p className="mt-1.5 text-meta text-ink-muted">
          Sample: <span className="font-semibold text-ink-soft">{sampleLabel}</span> -- this label describes the
          amount of observed activity, not a statistical confidence rating.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shared between the available and unavailable states so the same
 * explanation of how the score works (and, critically, how it does NOT
 * degrade -- no renormalizing missing weights) is one paragraph maintained
 * in one place.
 */
function MethodologyDetails() {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-meta font-semibold text-ink-soft">How this prototype score works</summary>
      <p className="mt-2 text-meta text-ink-soft">
        {OPPORTUNITY_SCORE_WEIGHTS.unmetDemand * 100}% observed unmet category-linked demand,{" "}
        {OPPORTUNITY_SCORE_WEIGHTS.supplyGap * 100}% participating Kirana Connect catalogue supply gap relative to
        the relevant catalogue, {OPPORTUNITY_SCORE_WEIGHTS.competition * 100}% mapped competitor density,{" "}
        {OPPORTUNITY_SCORE_WEIGHTS.financialFit * 100}% fit with the configured financial scheme structure. This
        is a transparent prototype heuristic for decision support, not a prediction of profitability or business
        success.
      </p>
      <p className="mt-2 text-meta text-ink-soft">
        Missing components are not treated as zero and the remaining weights are not renormalized -- if any
        required component is unavailable, the score itself is withheld entirely rather than calculated from a
        partial set of evidence.
      </p>
    </details>
  );
}

/**
 * The Prototype Opportunity Score -- see feasibilityEngine.js's
 * computeOpportunity for the full gating rules. Never a success/loan/ML
 * prediction; that framing is repeated here deliberately rather than
 * assumed obvious from context.
 */
function OpportunityScoreSection({ opportunity, demandSupply, financialPlan }) {
  if (opportunity.scoreStatus !== "available") {
    const demandOnlyMissing =
      opportunity.components.unmetDemand.status !== "available" &&
      opportunity.components.supplyGap.status === "available" &&
      opportunity.components.competition.status === "available";

    return (
      <div className="mt-5 rounded-card border border-line-soft bg-surface-sunken/60 p-4">
        <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
          <CircleHelp className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          Prototype Opportunity Score
        </p>
        <p className="mt-1 text-card font-bold text-ink">Not enough local evidence yet</p>
        <p className="mt-1 text-meta text-ink-muted">
          A score can only be calculated when all required evidence components are available.
        </p>

        <p className="mt-4 text-meta font-semibold text-ink-soft">Local evidence available</p>
        <div className="mt-2 grid gap-2">
          {CHECKLIST_ROWS.map(({ key, label, icon }) => {
            const component = opportunity.components[key];
            const available = component.status === "available";
            return (
              <EvidenceChecklistRow
                key={key}
                icon={icon}
                label={label}
                available={available}
                evidence={checklistEvidence(key, opportunity, financialPlan)}
                sampleLabel={
                  key === "unmetDemand" && available
                    ? DEMAND_SAMPLE_LABELS[opportunity.evidenceVolume.demandSampleStatus]
                    : null
                }
              />
            );
          })}
        </div>

        {demandOnlyMissing ? (
          <p className="mt-4 text-meta text-ink-soft">
            Opportunity Score will become available as category-linked Consumer search activity is recorded in
            this area.
          </p>
        ) : null}

        <MethodologyDetails />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-card border border-primary/30 bg-primary-soft/30 p-4">
      <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
        <Target className="size-4 shrink-0 text-primary" aria-hidden="true" />
        Prototype Opportunity Score
      </p>
      <p className="mt-1 text-heading font-bold text-ink tabular-nums">
        {opportunity.opportunityScore.toFixed(1)} <span className="text-body font-normal text-ink-muted">/ 100</span>
      </p>
      <p className="mt-1 text-meta text-ink-muted">
        Based on currently available evidence -- a transparent decision-support heuristic, not a prediction of
        profitability, success, or a loan-approval outcome.
      </p>

      <EvidenceVolumeLine
        demandSupply={demandSupply}
        financialPlan={financialPlan}
        demandSampleStatus={opportunity.evidenceVolume.demandSampleStatus}
      />

      <div className="mt-4 grid gap-2">
        {COMPONENT_ROWS.map(({ key, label }) => (
          <ScoreBreakdownRow key={key} label={label} component={opportunity.components[key]} />
        ))}
      </div>

      {opportunity.caveats.length > 0 ? (
        <ul className="mt-4 grid gap-1.5">
          {opportunity.caveats.map((c) => (
            <li key={c} className="flex items-start gap-2 text-meta text-ink-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      ) : null}

      <MethodologyDetails />
    </div>
  );
}

export default function FeasibilityAssessment({ demandSupplyState, financialPlan }) {
  // Both loading and error are handled explicitly here rather than falling
  // through to the engine's "insufficient-data" status: that status means
  // "we asked and there is genuinely not enough local history," which is a
  // different, more specific claim than "still fetching" or "the request
  // failed" -- showing the wrong one of these would misrepresent why data
  // is missing.
  if (demandSupplyState.status === "loading") {
    return (
    <LoadingInsight label="Putting your feasibility summary together..." />
    );
  }

  if (demandSupplyState.status === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Could not load feasibility data"
        description={demandSupplyState.message ?? "Please try again in a moment."}
        className="mt-5"
      />
    );
  }

  const assessment = calculateFeasibilityAssessment({ demandSupplyState, financialPlan });
  const { status, components, opportunity, conclusions, missingData } = assessment;
  const demandSupply = demandSupplyState.status === "loaded" ? demandSupplyState.data : null;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2.5 rounded-panel border border-line bg-surface p-4">
        <Gauge className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-card font-bold text-ink">Current assessment: {STATUS_LABEL[status]}</p>
      </div>
      <p className="mt-2 text-meta text-ink-muted">
        {status === "assessable" ? assessableExplanation(opportunity.scoreStatus) : STATUS_EXPLANATION[status]}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ComponentCard icon={Search} title="Demand Evidence">
          <DemandCard demand={components.demand} />
        </ComponentCard>
        <ComponentCard icon={ListTree} title="Supply Gap Evidence">
          <SupplyGapCard supplyGap={components.supplyGap} />
        </ComponentCard>
        <ComponentCard icon={Store} title="Competition Evidence">
          <CompetitionCard competition={components.competition} />
        </ComponentCard>
        <ComponentCard icon={IndianRupee} title="Financial Structure">
          <CapitalCard capital={components.capital} />
        </ComponentCard>
      </div>

      <OpportunityScoreSection opportunity={opportunity} demandSupply={demandSupply} financialPlan={financialPlan} />

      {conclusions.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-card text-ink">
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
            What we can conclude
          </h3>
          <ul className="mt-2 grid gap-1.5">
            {conclusions.map((line) => (
              <li key={line} className="flex items-start gap-2 text-meta text-ink-soft">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missingData.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-card text-ink">
            <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
            What needs more data
          </h3>
          <ul className="mt-2 grid gap-1.5">
            {missingData.map((line) => (
              <li key={line} className="flex items-start gap-2 text-meta text-ink-soft">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
