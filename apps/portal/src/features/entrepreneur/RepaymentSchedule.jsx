import { useState } from "react";
import { ChevronDown, ChevronUp, Coins, Info, Landmark, PauseCircle, Percent } from "lucide-react";
import { formatPrice } from "../../utils/format.js";
import { calculateRepaymentPlan, NOT_APPLICABLE_STATUS } from "./repaymentEngine.js";

const DEFAULT_VISIBLE_ROWS = 8;

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

function quarterRangeLabel(from, to) {
  return from === to ? `Q${from}` : `Q${from}–Q${to}`;
}

function PhaseTimeline({ moratoriumQuarters, repaymentQuarters }) {
  const total = moratoriumQuarters + repaymentQuarters;
  const moratoriumPercent = (moratoriumQuarters / total) * 100;

  return (
    <div className="mt-4">
      <div
        role="img"
        aria-label={`Q1 to Q${moratoriumQuarters} moratorium, Q${moratoriumQuarters + 1} to Q${total} repayment`}
        className="flex h-3 w-full overflow-hidden rounded-pill border border-line-soft"
      >
        <div className="h-full bg-warning-soft" style={{ width: `${moratoriumPercent}%` }} />
        <div className="h-full bg-primary" style={{ width: `${100 - moratoriumPercent}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-meta text-ink-muted">
        <span>{quarterRangeLabel(1, moratoriumQuarters)} Moratorium</span>
        <span>{quarterRangeLabel(moratoriumQuarters + 1, total)} Repayment</span>
      </div>
    </div>
  );
}

function ScheduleTable({ schedule }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = schedule.length > DEFAULT_VISIBLE_ROWS;
  const visibleRows = expanded ? schedule : schedule.slice(0, DEFAULT_VISIBLE_ROWS);

  return (
    <div className="mt-3">
      <div className="overflow-x-auto rounded-panel border border-line">
        <table className="w-full min-w-[640px] text-left text-meta">
          <caption className="sr-only">Illustrative quarterly repayment schedule</caption>
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-ink-soft">
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Quarter</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Phase</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Opening Balance</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Interest</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Principal</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Payment</th>
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {visibleRows.map((row) => (
              <tr key={row.quarter}>
                <td className="px-3.5 py-2.5 tabular-nums text-ink">Q{row.quarter}</td>
                <td className="px-3.5 py-2.5 text-ink-soft">
                  {row.phase === "moratorium" ? "Moratorium" : "Repayment"}
                </td>
                <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{formatPrice(row.openingBalance)}</td>
                <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{formatPrice(row.interest)}</td>
                <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{formatPrice(row.principalPaid)}</td>
                <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{formatPrice(row.payment)}</td>
                <td className="px-3.5 py-2.5 tabular-nums text-ink">{formatPrice(row.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3.5 py-2 text-meta font-semibold text-ink-soft transition-colors hover:border-ink-muted"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
              Show fewer quarters
            </>
          ) : (
            <>
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
              View full {schedule.length}-quarter schedule
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Rendered inside FinancialRoadmap.jsx, not as a separate top-level page
 * section -- the Financial Roadmap -> Funding Structure -> Scheme Details ->
 * Repayment & Moratorium information belongs together.
 */
export default function RepaymentSchedule({ plan }) {
  const repayment = calculateRepaymentPlan(plan);

  if (repayment.status === NOT_APPLICABLE_STATUS) {
    return (
      <div className="mt-5">
        <h3 className="text-card text-ink">Repayment &amp; Moratorium</h3>
        <p className="mt-2 text-meta text-ink-muted">
          A repayment schedule is not calculated because no configured scheme applies to this project cost.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3 className="text-card text-ink">Repayment &amp; Moratorium</h3>
      <p className="mt-1 text-meta text-ink-muted">
        An illustrative estimate for the {formatPrice(repayment.principal)} eligible agency finance -- not the
        official sanction schedule.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Landmark} label="Loan Principal" value={formatPrice(repayment.principal)} />
        <StatCard
          icon={PauseCircle}
          label="Moratorium"
          value={`${repayment.moratoriumMonths} months`}
          sublabel={`${repayment.moratoriumQuarters} quarter${repayment.moratoriumQuarters === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={Coins}
          label="Estimated Quarterly Instalment"
          value={formatPrice(repayment.regularQuarterlyPayment)}
          sublabel={`${repayment.repaymentQuarters} quarters`}
        />
        <StatCard
          icon={Percent}
          label="Total Estimated Interest"
          value={formatPrice(repayment.totalInterest)}
          sublabel={`${(repayment.quarterlyInterestRate * 100).toFixed(3)}% per quarter`}
        />
      </div>

      <p className="mt-3 text-meta text-ink-soft">
        Total estimated repayment (principal + interest): <span className="font-semibold text-ink">{formatPrice(repayment.totalRepayment)}</span>
      </p>

      <PhaseTimeline moratoriumQuarters={repayment.moratoriumQuarters} repaymentQuarters={repayment.repaymentQuarters} />

      <div className="mt-4 flex items-start gap-2.5 rounded-card border border-warning/30 bg-warning-soft p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-meta text-ink-soft">
          During the {repayment.moratoriumMonths}-month moratorium, this prototype assumes no instalment is
          paid and interest continues to accrue on the outstanding loan. The accrued interest
          ({formatPrice(repayment.balanceAfterMoratorium - repayment.principal)}) is added to the balance
          before quarterly repayments begin, bringing it to {formatPrice(repayment.balanceAfterMoratorium)}.
        </p>
      </div>

      <ScheduleTable schedule={repayment.schedule} />
    </div>
  );
}
