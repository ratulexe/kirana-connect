import { useId, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, Wallet } from "lucide-react";
import { formatPrice } from "../../utils/format.js";
import { saveAnalysisInput } from "./analysisSessionState.js";

const RESERVE_OPTIONS = [1, 2, 3, 6];
const DEFAULT_RESERVE_MONTHS = 3;

const AMOUNT_FIELDS = [
  { key: "monthlyRent", label: "Monthly Rent" },
  { key: "monthlyStaffCost", label: "Monthly Staff Cost" },
  { key: "monthlyUtilities", label: "Monthly Utilities" },
  { key: "otherMonthlyExpenses", label: "Other Monthly Operating Expenses" },
];

/**
 * Blank, negative or non-numeric text is treated as ₹0 for calculation --
 * never a fabricated default. This only ever runs on what the entrepreneur
 * actually typed; it never invents a starting value for an untouched field
 * (see the `useState` initializer below, which leaves untouched fields as
 * the empty string, not 0).
 */
function amountOrZero(raw) {
  const value = Number(raw);
  return raw === "" || raw === null || raw === undefined || !Number.isFinite(value) || value < 0 ? 0 : value;
}

function initialValues(workingCapital) {
  return {
    monthlyRent: workingCapital?.monthlyRent ?? "",
    monthlyStaffCost: workingCapital?.monthlyStaffCost ?? "",
    monthlyUtilities: workingCapital?.monthlyUtilities ?? "",
    otherMonthlyExpenses: workingCapital?.otherMonthlyExpenses ?? "",
    initialInventory: workingCapital?.initialInventory ?? "",
    reserveMonths: workingCapital?.reserveMonths ?? DEFAULT_RESERVE_MONTHS,
  };
}

function SummaryRow({ label, value, emphasis }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-line-soft bg-surface px-3.5 py-2.5">
      <span className={`text-meta ${emphasis ? "font-semibold text-ink" : "text-ink-soft"}`}>{label}</span>
      <span className={`text-meta tabular-nums ${emphasis ? "font-bold text-ink" : "text-ink-soft"}`}>{value}</span>
    </div>
  );
}

/**
 * Working Capital + Operating Cost Planner. Every number here comes from
 * what the entrepreneur types in this section -- nothing is estimated,
 * defaulted, or looked up. `analysisInput` is the exact object
 * EntrepreneurAnalysis.jsx already holds (location/category/radius/margin,
 * now with an optional `workingCapital` key); every edit here re-saves that
 * same object through the existing validated sessionStorage mechanism
 * (analysisSessionState.js) so these figures survive a hard refresh exactly
 * like the rest of the report input does. Tab-switch persistence needs no
 * extra work: this component stays mounted the whole time a report is open
 * (see EntrepreneurAnalysis.jsx's permanently-mounted tab panels), so its
 * own `useState` already survives switching away and back.
 */
export default function WorkingCapitalPlanner({ analysisInput, projectCost }) {
  const [values, setValues] = useState(() => initialValues(analysisInput?.workingCapital));
  const headingId = useId();

  function commit(next) {
    setValues(next);
    saveAnalysisInput({
      ...analysisInput,
      workingCapital: {
        monthlyRent: amountOrZero(next.monthlyRent),
        monthlyStaffCost: amountOrZero(next.monthlyStaffCost),
        monthlyUtilities: amountOrZero(next.monthlyUtilities),
        otherMonthlyExpenses: amountOrZero(next.otherMonthlyExpenses),
        initialInventory: amountOrZero(next.initialInventory),
        reserveMonths: next.reserveMonths,
      },
    });
  }

  function updateAmount(key, raw) {
    // Keep only what a rupee amount can contain -- digits and one decimal
    // point -- so a stray letter can't silently zero out the field via
    // amountOrZero's NaN fallback without the entrepreneur noticing.
    const cleaned = raw.replace(/[^\d.]/g, "");
    commit({ ...values, [key]: cleaned });
  }

  function updateReserveMonths(raw) {
    const months = Number(raw);
    commit({ ...values, reserveMonths: RESERVE_OPTIONS.includes(months) ? months : DEFAULT_RESERVE_MONTHS });
  }

  const monthlyOperatingCost =
    amountOrZero(values.monthlyRent) +
    amountOrZero(values.monthlyStaffCost) +
    amountOrZero(values.monthlyUtilities) +
    amountOrZero(values.otherMonthlyExpenses);
  const initialInventory = amountOrZero(values.initialInventory);
  const workingCapitalReserve = monthlyOperatingCost * values.reserveMonths;
  const initialOperationalRequirement = initialInventory + workingCapitalReserve;

  const hasAnyInput =
    AMOUNT_FIELDS.some((field) => values[field.key] !== "") || values.initialInventory !== "";
  const fitsProjectCost = initialOperationalRequirement <= projectCost;
  const shortfall = initialOperationalRequirement - projectCost;

  return (
    <section aria-labelledby={headingId} className="mt-10">
      <h2 id={headingId} className="flex items-center gap-2 text-section text-ink">
        <Wallet className="size-5 shrink-0 text-primary" aria-hidden="true" />
        Working Capital Planner
      </h2>
      <p className="mt-1.5 max-w-2xl text-body text-ink-muted">
        Enter your own expected monthly running costs and starting stock requirement -- Kirana Connect does not
        estimate these for you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {AMOUNT_FIELDS.map((field) => {
          const inputId = `${headingId}-${field.key}`;
          return (
            <label key={field.key} htmlFor={inputId} className="grid gap-1">
              <span className="text-meta font-semibold text-ink-soft">{field.label}</span>
              <span className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-body text-ink-muted">
                  ₹
                </span>
                <input
                  id={inputId}
                  type="text"
                  inputMode="decimal"
                  value={values[field.key]}
                  onChange={(event) => updateAmount(field.key, event.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-control border border-line bg-surface pr-3 pl-7 text-body text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </span>
            </label>
          );
        })}

        <label htmlFor={`${headingId}-inventory`} className="grid gap-1">
          <span className="text-meta font-semibold text-ink-soft">Initial Inventory / Stock Requirement</span>
          <span className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-body text-ink-muted">
              ₹
            </span>
            <input
              id={`${headingId}-inventory`}
              type="text"
              inputMode="decimal"
              value={values.initialInventory}
              onChange={(event) => updateAmount("initialInventory", event.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-control border border-line bg-surface pr-3 pl-7 text-body text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </span>
        </label>

        <label htmlFor={`${headingId}-reserve`} className="grid gap-1">
          <span className="text-meta font-semibold text-ink-soft">Reserve Period</span>
          <select
            id={`${headingId}-reserve`}
            value={values.reserveMonths}
            onChange={(event) => updateReserveMonths(event.target.value)}
            className="h-11 w-full rounded-control border border-line bg-surface px-3 text-body text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {RESERVE_OPTIONS.map((months) => (
              <option key={months} value={months}>
                {months} {months === 1 ? "month" : "months"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-2">
        <SummaryRow label="Initial Inventory / Stock" value={formatPrice(initialInventory)} />
        <SummaryRow label="Monthly Operating Cost" value={formatPrice(monthlyOperatingCost)} />
        <SummaryRow
          label={`Working Capital Reserve (× ${values.reserveMonths} ${values.reserveMonths === 1 ? "month" : "months"})`}
          value={formatPrice(workingCapitalReserve)}
        />
        <SummaryRow
          label="Initial Operational Requirement"
          value={formatPrice(initialOperationalRequirement)}
          emphasis
        />
      </div>

      {hasAnyInput ? (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-card border p-3.5 ${
            fitsProjectCost ? "border-success/35 bg-success-soft" : "border-warning/35 bg-warning-soft"
          }`}
        >
          {fitsProjectCost ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          )}
          <p className="text-meta text-ink-soft">
            {fitsProjectCost
              ? "Your entered operating and inventory requirement fits within the current indicative project-cost envelope."
              : `Your entered operating and inventory requirement exceeds the current indicative project-cost envelope by ${formatPrice(shortfall)}.`}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-meta text-ink-muted">
          Enter your costs above to compare them against the indicative project cost of {formatPrice(projectCost)}.
        </p>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-soft bg-surface-sunken/60 p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="text-meta text-ink-muted">
          <p>
            These values are based entirely on the costs you enter. Kirana Connect does not currently estimate
            rent, salary, utility, procurement, or inventory costs automatically.
          </p>
          <p className="mt-1.5">
            Actual working-capital requirements may differ based on location, supplier terms, sales cycle, and
            business type. This is not a profitability analysis.
          </p>
        </div>
      </div>
    </section>
  );
}
