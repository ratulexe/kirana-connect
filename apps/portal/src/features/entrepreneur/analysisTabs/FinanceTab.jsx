import FinancialRoadmap from "../FinancialRoadmap.jsx";
import WorkingCapitalPlanner from "../WorkingCapitalPlanner.jsx";

/**
 * FinancialRoadmap (which already renders the Repayment & Moratorium
 * subsection, including the collapsible full quarterly schedule) is
 * unchanged. WorkingCapitalPlanner is the one new section here -- it reads
 * and writes `analysisInput.workingCapital` through the same validated
 * sessionStorage mechanism the rest of the report input already uses; see
 * WorkingCapitalPlanner.jsx.
 */
export default function FinanceTab({ plan, analysisInput }) {
  return (
    <div className="py-8 sm:py-10">
      <h1 className="text-heading text-ink">Finance</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-muted">
        Financial roadmap, funding structure, scheme details and the illustrative repayment schedule.
      </p>

      <FinancialRoadmap plan={plan} />
      <WorkingCapitalPlanner analysisInput={analysisInput} projectCost={plan.projectCost} />
    </div>
  );
}
