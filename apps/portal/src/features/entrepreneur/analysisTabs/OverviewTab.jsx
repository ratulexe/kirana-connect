import { Briefcase, Compass, IndianRupee, MapPin, MapPinned, Printer } from "lucide-react";
import { formatPrice } from "../../../utils/format.js";
import FeasibilityAssessment from "../FeasibilityAssessment.jsx";

const NAV_CARDS = [
  { tab: "market", title: "Market", description: "Demand, competitors, market reach and observed local prices." },
  { tab: "finance", title: "Finance", description: "Financial roadmap, funding structure and repayment schedule." },
  { tab: "risks", title: "Risks & SWOT", description: "Evidence-based risks and SWOT for this business." },
  { tab: "advisor", title: "AI Advisor", description: "Ask questions about this report in English, Bengali or Hindi." },
];

const METHODOLOGY_POINTS = [
  "External map coverage (competitors) may be incomplete -- absence from the map is not proof of no competition.",
  "Demand reflects Kirana Connect's own observed consumer search activity, not a full market survey.",
  "Supply reflects participating Kirana Connect stores only, not every offline business in the area.",
  "A verified local population estimate is not currently available from any configured source.",
  "Household purchasing-power / income data is not measured anywhere in this system.",
  "The repayment schedule (Finance tab) is an illustrative prototype assumption, not an official agency schedule.",
  "The AI Advisor is advisory only -- it explains this report, it does not calculate or guarantee anything.",
  "Final loan sanction and eligibility remain subject to the relevant implementing agency.",
  "Prototype Opportunity Score -- a transparent decision-support heuristic, not a profitability prediction, success probability, loan-approval score, or ML output. It combines four weighted components: (1) Demand -- 40% weight, from category-linked observed Consumer searches only, never unclassified zero-result queries; (2) Supply -- 25% weight, from participating Kirana Connect supply against the relevant catalogue; (3) Competition -- 20% weight, from mapped competitor density; (4) Financial Fit -- 15% weight, from configured scheme/funding-gap fit. It is only calculated when category-linked demand evidence exists and every component can be computed -- a missing component withholds the score rather than renormalizing the remaining weights.",
  "External businesses may have inventory that is not visible to Kirana Connect, so the Opportunity Score's supply component reflects participating Kirana Connect supply only, not the entire real-world market.",
  "Unclassified zero-result Consumer searches are shown as potential opportunity leads (Risks & SWOT tab) but are excluded from the Opportunity Score, since they are not yet mapped to the selected business category.",
];

/**
 * The default tab. Deliberately narrow -- a summary and the existing
 * FeasibilityAssessment (which already covers current status, evidence
 * cards, conclusions and missing-data), plus compact links to the detailed
 * tabs. No new Opportunity Score, no detailed tables: those live in Market/
 * Finance/Risks & SWOT.
 */
export default function OverviewTab({ location, businessCategory, radiusKm, availableMargin, plan, demandSupplyState, onNavigateTab }) {
  return (
    <div className="py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-heading text-balance text-ink">Your hyper-local business analysis</h1>
          <p className="mt-2 text-body text-ink-muted">
            A deterministic feasibility report built from real data where it exists, and explicit about what is
            still missing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print-hide inline-flex shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3.5 py-2 text-meta font-semibold text-ink-soft transition-colors hover:border-primary hover:text-ink"
        >
          <Printer className="size-3.5 shrink-0" aria-hidden="true" />
          Print Report
        </button>
      </div>

      <dl className="mt-6 grid gap-3 rounded-panel border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <MapPin className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-meta font-semibold text-ink-soft">Location</dt>
            <dd className="mt-0.5 text-body break-words text-ink">{location?.label ?? location?.query}</dd>
            <dd className="mt-0.5 text-meta text-ink-muted tabular-nums">
              {location?.latitude?.toFixed(5)}, {location?.longitude?.toFixed(5)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <Briefcase className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-meta font-semibold text-ink-soft">Business category</dt>
            <dd className="mt-0.5 text-body text-ink">{businessCategory?.name}</dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <IndianRupee className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-meta font-semibold text-ink-soft">Available margin capital</dt>
            <dd className="mt-0.5 text-body text-ink">{formatPrice(availableMargin)}</dd>
            <dd className="mt-0.5 text-meta text-ink-muted">
              Indicative Project Size: {formatPrice(plan.projectCost)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <MapPinned className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-meta font-semibold text-ink-soft">Analysis radius</dt>
            <dd className="mt-0.5 text-body text-ink">Within {radiusKm} km</dd>
          </div>
        </div>
      </dl>

      <section aria-labelledby="overview-feasibility-heading" className="mt-8">
        <h2 id="overview-feasibility-heading" className="text-section text-ink">
          Business Feasibility Assessment
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          A transparent summary of the evidence. This is not an AI-generated opinion, and not a single score when the
          underlying data does not yet support one.
        </p>
        <FeasibilityAssessment demandSupplyState={demandSupplyState} financialPlan={plan} />
      </section>

      <section aria-labelledby="overview-explore-heading" className="print-hide mt-8">
        <h2 id="overview-explore-heading" className="text-section text-ink">
          Explore the full report
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {NAV_CARDS.map((card) => (
            <li key={card.tab}>
              <button
                type="button"
                onClick={() => onNavigateTab(card.tab)}
                className="flex h-full w-full flex-col items-start gap-1 rounded-card border border-line bg-surface p-4 text-left transition-colors hover:border-primary"
              >
                <span className="text-body font-semibold text-ink">{card.title}</span>
                <span className="text-meta text-ink-muted">{card.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="print-hide mt-8 flex items-center gap-2 text-meta text-ink-muted">
        <Compass className="size-3.5 shrink-0" aria-hidden="true" />
        Use the tabs above to explore Market, Finance, Risks &amp; SWOT, and the AI Advisor.
      </p>

      <details className="mt-8 rounded-panel border border-line bg-surface-sunken/60 p-5">
        <summary className="cursor-pointer text-body font-semibold text-ink">Data &amp; Methodology</summary>
        <ul className="mt-3 grid gap-2">
          {METHODOLOGY_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-meta text-ink-soft">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-muted" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
