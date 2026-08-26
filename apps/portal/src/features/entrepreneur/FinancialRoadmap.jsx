import { AlertTriangle, HelpCircle, Info, Landmark, PiggyBank, Timer, TrendingUp } from "lucide-react";
import { formatPrice } from "../../utils/format.js";
import { ELIGIBLE_STATUS } from "./financialEngine.js";
import RepaymentSchedule from "./RepaymentSchedule.jsx";

const MICRO_FINANCE_CEILING_LABEL = "₹1.40 lakh";
const TERM_LOAN_CEILING_LABEL = "₹50 lakh";

function whyThisScheme(plan) {
  const costLabel = formatPrice(plan.projectCost);

  if (plan.status !== ELIGIBLE_STATUS) {
    return `Your indicative project cost of ${costLabel} exceeds the ${TERM_LOAN_CEILING_LABEL} project-cost ceiling of the schemes currently configured in this prototype.`;
  }

  if (plan.scheme.code === "micro-finance") {
    return `Your indicative project cost of ${costLabel} falls within the Micro Finance Scheme project-cost ceiling of ${MICRO_FINANCE_CEILING_LABEL}.`;
  }

  return `Your indicative project cost of ${costLabel} is above ${MICRO_FINANCE_CEILING_LABEL} and within the ${TERM_LOAN_CEILING_LABEL} Term Loan Scheme range.`;
}

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-card font-bold text-ink break-words">{value}</p>
      {sublabel ? <p className="mt-0.5 text-meta text-ink-muted">{sublabel}</p> : null}
    </div>
  );
}

/**
 * Renders the real Module 2 output for an in-range project: Financial
 * Structure Visual + scheme details + funding gap notice. For a
 * calculated project cost above the configured Term Loan ceiling, it shows
 * only what is actually known (margin, indicative cost) and never invents
 * a loan amount, interest rate, or tenure for a scheme that does not exist.
 */
export default function FinancialRoadmap({ plan }) {
  const isEligible = plan.status === ELIGIBLE_STATUS;
  // Contribution is always exactly marginPercentage by definition (project
  // cost is defined as margin / 0.10). Agency is the actual eligibleLoan as
  // a share of project cost, not the theoretical 90% -- when the Micro
  // Finance ceiling caps the loan, this comes in under 90%, and the two
  // segments together fall short of 100%, visually showing the funding gap.
  const contributionPercentage = isEligible ? plan.marginPercentage : null;
  const agencyPercentage = isEligible ? Math.round((plan.eligibleLoan / plan.projectCost) * 1000) / 10 : null;

  return (
    <section aria-labelledby="financial-roadmap-heading" className="mt-10">
      <h2 id="financial-roadmap-heading" className="text-section text-ink">
        Financial Roadmap
      </h2>
      <p className="mt-1.5 text-body text-ink-muted">
        A deterministic calculation from the margin you entered -- not an AI estimate.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={PiggyBank}
          label="Your Contribution"
          value={formatPrice(plan.availableMargin)}
          sublabel={`${plan.marginPercentage}% Margin`}
        />
        <StatCard
          icon={TrendingUp}
          label="Indicative Project Cost"
          value={formatPrice(plan.projectCost)}
          sublabel="Calculated using the configured 10% beneficiary margin structure."
        />
        {isEligible ? (
          <StatCard
            icon={Landmark}
            label="Eligible Agency Finance"
            value={formatPrice(plan.eligibleLoan)}
            sublabel={`Up to ${plan.agencySharePercentage}% of project cost`}
          />
        ) : (
          <StatCard
            icon={Landmark}
            label="Configured Scheme Match"
            value="No configured scheme match"
          />
        )}
        <StatCard
          icon={Timer}
          label="Recommended Scheme"
          value={isEligible ? plan.scheme.name : "None"}
          sublabel={isEligible ? `${plan.scheme.interestRateAnnual}% p.a. · ${plan.scheme.tenureYears} yr tenure` : undefined}
        />
      </div>

      {isEligible ? (
        <div className="mt-5 rounded-panel border border-line bg-surface p-5 sm:p-6">
          <p className="text-meta font-semibold text-ink-soft uppercase tracking-wide">Funding structure</p>
          <p className="mt-1 text-card font-bold text-ink">Project Cost: {formatPrice(plan.projectCost)}</p>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-control bg-primary-soft p-3">
              <dt className="text-meta font-semibold text-primary">Your Contribution</dt>
              <dd className="mt-0.5 text-card font-bold text-ink">{formatPrice(plan.availableMargin)}</dd>
              <dd className="text-meta text-ink-muted">{contributionPercentage}% of project cost</dd>
            </div>
            <div className="rounded-control bg-primary/10 p-3">
              <dt className="text-meta font-semibold text-primary">Agency Finance</dt>
              <dd className="mt-0.5 text-card font-bold text-ink">{formatPrice(plan.eligibleLoan)}</dd>
              <dd className="text-meta text-ink-muted">{agencyPercentage}% of project cost</dd>
            </div>
          </dl>

          <div
            role="img"
            aria-label={`Funding split: ${contributionPercentage}% your contribution, ${agencyPercentage}% agency finance`}
            className="mt-4 flex h-3 w-full overflow-hidden rounded-pill border border-line-soft"
          >
            <div className="h-full bg-primary-soft" style={{ width: `${contributionPercentage}%` }} />
            <div className="h-full bg-primary" style={{ width: `${agencyPercentage}%` }} />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-panel border border-line bg-surface p-5 sm:p-6">
          <p className="text-body text-ink-soft">{whyThisScheme(plan)}</p>
          <p className="mt-2 text-meta text-ink-muted">
            Your available margin ({formatPrice(plan.availableMargin)}) and indicative project cost (
            {formatPrice(plan.projectCost)}) are shown above. This does not mean no support is available --
            only that it falls outside the two schemes currently configured in this prototype.
          </p>
        </div>
      )}

      {isEligible && plan.fundingGap > 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-card border border-warning/35 bg-warning-soft p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-card font-bold text-ink">Funding Gap: {formatPrice(plan.fundingGap)}</p>
            <p className="mt-1 text-meta text-ink-soft">
              The {plan.scheme.name} financing ceiling ({formatPrice(plan.scheme.maxLoanAmount)}) prevents the
              full {plan.agencySharePercentage}% project-cost component from being financed under the
              configured rules, leaving this amount to be arranged from another source.
            </p>
          </div>
        </div>
      ) : null}

      {isEligible ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-surface-sunken p-4">
            <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
              <HelpCircle className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Why this scheme?
            </p>
            <p className="mt-2 text-body text-ink-soft">{whyThisScheme(plan)}</p>
          </div>

          <div className="rounded-card border border-line bg-surface-sunken p-4">
            <p className="text-meta font-semibold text-ink-soft">Scheme details</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-body">
              <dt className="text-ink-muted">Scheme</dt>
              <dd className="text-ink">{plan.scheme.name}</dd>
              <dt className="text-ink-muted">Agency Finance</dt>
              <dd className="text-ink">Up to {plan.agencySharePercentage}%</dd>
              <dt className="text-ink-muted">Maximum Finance</dt>
              <dd className="text-ink">{formatPrice(plan.scheme.maxLoanAmount)}</dd>
              <dt className="text-ink-muted">Interest</dt>
              <dd className="text-ink">{plan.scheme.interestRateAnnual}% p.a.</dd>
              <dt className="text-ink-muted">Tenure</dt>
              <dd className="text-ink">{plan.scheme.tenureYears} years</dd>
              <dt className="text-ink-muted">Moratorium</dt>
              <dd className="text-ink">{plan.scheme.moratoriumMonths} months</dd>
            </dl>
          </div>
        </div>
      ) : null}

      <RepaymentSchedule plan={plan} />

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-soft bg-surface-sunken/60 p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <p className="text-meta text-ink-muted">
          This prototype calculates the financial structure using the scheme parameters supplied in the
          problem statement -- that part (project cost, agency share, scheme match) follows the problem
          statement directly. The repayment schedule above is different: the problem statement does not
          specify how moratorium interest is treated, whether it is capitalized, or how instalments are
          rounded, so that schedule is this prototype's own illustrative modelling assumption, not an
          agency-issued figure. Final eligibility, sanction, and loan conditions remain subject to
          verification and approval by the relevant implementing agency.
        </p>
      </div>
    </section>
  );
}
