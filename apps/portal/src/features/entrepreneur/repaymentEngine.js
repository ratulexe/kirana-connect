import { ELIGIBLE_STATUS } from "./financialEngine.js";

/**
 * Illustrative Repayment & Moratorium engine (Module 10). Pure and
 * deterministic, no AI -- reuses financialEngine.js's scheme constants and
 * eligibleLoan output as its only input, and never recalculates or
 * overrides scheme eligibility, funding gap, or agency-share figures.
 *
 * The supplied problem statement gives an annual interest rate, a total
 * tenure that already INCLUDES the moratorium, a moratorium duration, and
 * asks for a quarterly repayment schedule. It does NOT specify whether
 * interest is waived or paid during moratorium, whether accrued interest is
 * capitalized, the exact amortization method, or agency rounding rules.
 * Those are genuinely unspecified, not merely undocumented, so this module
 * makes one explicit, centralized, clearly-labeled modelling assumption
 * (see ASSUMPTION below) rather than silently guessing -- the UI must show
 * this is illustrative, never "the official sanction schedule."
 */
export const ASSUMPTION = {
  code: "capitalized-moratorium-reducing-balance",
  description:
    "During the moratorium, no instalment is due and interest continues to accrue on the outstanding balance; that accrued interest is capitalized (added to principal) before repayment begins. After the moratorium, the capitalized balance is repaid through equal quarterly instalments calculated on the reducing balance, at one quarter of the scheme's annual interest rate.",
};

export const NOT_APPLICABLE_STATUS = "not-applicable";
export const AVAILABLE_STATUS = "available";

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

// Same reasoning as financialEngine.js's fromPaise: toFixed rounds
// decimally before the string->number conversion, which is what actually
// removes binary float noise.
function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

/**
 * Standard reducing-balance annuity payment for n quarters at quarterly
 * rate r on principal P: P * r * (1+r)^n / ((1+r)^n - 1). Falls back to a
 * plain P/n split if a future scheme ever configures a zero rate, so this
 * never divides by zero.
 */
function annuityPaymentPaise(balancePaise, quarterlyRate, quarters) {
  if (quarters <= 0) return 0;
  if (quarterlyRate === 0) return Math.round(balancePaise / quarters);

  const growth = (1 + quarterlyRate) ** quarters;
  const factor = (quarterlyRate * growth) / (growth - 1);
  return Math.round(balancePaise * factor);
}

/**
 * calculateRepaymentPlan(financialPlan) -> repayment plan, or
 * { status: "not-applicable" } when there is no real loan to amortize
 * (outside the two configured schemes, or a zero/negative eligible loan).
 * Never fabricates a schedule for an imaginary loan.
 */
export function calculateRepaymentPlan(financialPlan) {
  if (financialPlan.status !== ELIGIBLE_STATUS || !(financialPlan.eligibleLoan > 0)) {
    return { status: NOT_APPLICABLE_STATUS };
  }

  const { scheme, eligibleLoan: principal } = financialPlan;
  const annualInterestRate = scheme.interestRateAnnual;
  const quarterlyInterestRate = annualInterestRate / 100 / 4;

  const tenureMonths = scheme.tenureYears * 12;
  const totalQuarters = tenureMonths / 3;
  const moratoriumMonths = scheme.moratoriumMonths;
  const moratoriumQuarters = moratoriumMonths / 3;
  const repaymentQuarters = totalQuarters - moratoriumQuarters;

  const principalPaise = toPaise(principal);
  const schedule = [];
  let balancePaise = principalPaise;
  let totalInterestPaise = 0;

  // Moratorium: interest accrues every quarter and is capitalized into the
  // balance the next quarter's interest is computed on. No payment is due.
  for (let quarter = 1; quarter <= moratoriumQuarters; quarter += 1) {
    const openingBalancePaise = balancePaise;
    const interestPaise = Math.round(openingBalancePaise * quarterlyInterestRate);
    const closingBalancePaise = openingBalancePaise + interestPaise;

    schedule.push({
      quarter,
      phase: "moratorium",
      openingBalance: fromPaise(openingBalancePaise),
      interest: fromPaise(interestPaise),
      payment: 0,
      principalPaid: 0,
      closingBalance: fromPaise(closingBalancePaise),
    });

    totalInterestPaise += interestPaise;
    balancePaise = closingBalancePaise;
  }

  const balanceAfterMoratoriumPaise = balancePaise;
  const regularPaymentPaise = annuityPaymentPaise(balanceAfterMoratoriumPaise, quarterlyInterestRate, repaymentQuarters);

  // Repayment: a fixed quarterly instalment computed once against the
  // post-moratorium balance. Rounding each quarter's interest to the
  // nearest paisa means the fixed instalment will not extinguish the
  // balance to exactly zero on its own after `repaymentQuarters` of
  // compounding rounding -- the final quarter absorbs that drift instead
  // of leaving a residual paisa outstanding or negative.
  for (let i = 1; i <= repaymentQuarters; i += 1) {
    const isFinalQuarter = i === repaymentQuarters;
    const openingBalancePaise = balancePaise;
    const interestPaise = Math.round(openingBalancePaise * quarterlyInterestRate);

    let paymentPaise = regularPaymentPaise;
    let principalPaidPaise = paymentPaise - interestPaise;
    let closingBalancePaise = openingBalancePaise - principalPaidPaise;

    if (isFinalQuarter) {
      principalPaidPaise = openingBalancePaise;
      paymentPaise = principalPaidPaise + interestPaise;
      closingBalancePaise = 0;
    }

    schedule.push({
      quarter: moratoriumQuarters + i,
      phase: "repayment",
      openingBalance: fromPaise(openingBalancePaise),
      interest: fromPaise(interestPaise),
      payment: fromPaise(paymentPaise),
      principalPaid: fromPaise(principalPaidPaise),
      closingBalance: fromPaise(closingBalancePaise),
    });

    totalInterestPaise += interestPaise;
    balancePaise = closingBalancePaise;
  }

  const totalRepaymentPaise = principalPaise + totalInterestPaise;

  return {
    status: AVAILABLE_STATUS,
    assumption: ASSUMPTION,
    principal,
    annualInterestRate,
    quarterlyInterestRate,
    tenureMonths,
    totalQuarters,
    moratoriumMonths,
    moratoriumQuarters,
    repaymentQuarters,
    balanceAfterMoratorium: fromPaise(balanceAfterMoratoriumPaise),
    regularQuarterlyPayment: fromPaise(regularPaymentPaise),
    totalInterest: fromPaise(totalInterestPaise),
    totalRepayment: fromPaise(totalRepaymentPaise),
    schedule,
  };
}
