/**
 * Smart Financial Calculator & Scheme Router (Module 2).
 *
 * Pure, deterministic, no AI involved. Every number here comes from the two
 * schemes supplied in the problem statement -- nothing is invented for
 * project costs outside their configured range, and nothing about EMI,
 * quarterly repayment, or moratorium-interest treatment is calculated here:
 * the problem statement does not specify how interest accrues during the
 * moratorium, so that stays out of scope until a future milestone makes the
 * assumption explicit rather than guessing.
 *
 * All internal arithmetic runs on integer paise, not rupee floats: 14000.10
 * margin, multiplied by 10 for project cost, must land on exactly 1,40,001
 * rupees for the Term Loan boundary to trigger correctly, and IEEE-754
 * float multiplication does not reliably guarantee that on rupee values.
 */

const MARGIN_PERCENTAGE = 10;
const AGENCY_SHARE_PERCENTAGE = 90;

/**
 * The single source of truth for scheme parameters. Nothing outside this
 * module should hard-code an interest rate, tenure, moratorium, or ceiling
 * -- the future repayment engine reuses these same entries.
 */
export const FINANCIAL_SCHEMES = {
  MICRO_FINANCE: {
    code: "micro-finance",
    name: "Micro Finance Scheme",
    interestRateAnnual: 6.5,
    tenureYears: 3,
    moratoriumMonths: 3,
    maxProjectCost: 140_000,
    maxLoanAmount: 125_000,
  },
  TERM_LOAN: {
    code: "term-loan",
    name: "Term Loan Scheme",
    interestRateAnnual: 8,
    tenureYears: 7,
    moratoriumMonths: 6,
    maxProjectCost: 5_000_000,
    maxLoanAmount: 4_500_000,
  },
};

export const OUTSIDE_SCHEME_LIMIT_STATUS = "outside-configured-scheme-limit";
export const INVALID_INPUT_STATUS = "invalid-input";
export const ELIGIBLE_STATUS = "eligible";

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

// toFixed rounds decimally before the string->number conversion, which is
// what actually removes binary float noise -- plain `paise / 100` can land
// on e.g. 140000.99999999999 for values that are exact whole rupees.
function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

/**
 * projectCost = availableMargin / 0.10, equivalently availableMargin * 10:
 * the beneficiary's margin is defined as ~10% of total project cost.
 *
 * Scheme routing (exact boundaries, all evaluated in integer paise):
 *   projectCost <= 1,40,000        -> Micro Finance Scheme
 *   1,40,000 < projectCost <= 50,00,000 -> Term Loan Scheme
 *   projectCost > 50,00,000        -> outside the two configured schemes
 *
 * eligibleLoan = min(projectCost * 0.90, scheme.maxLoanAmount) -- this is
 * what keeps the Micro Finance Scheme's stated 90% share from silently
 * displaying 1,26,000 when the scheme's own ceiling is 1,25,000.
 *
 * fundingGap = max(projectCost - availableMargin - eligibleLoan, 0) -- the
 * shortfall the Micro Finance cap alone can create at the top of its band.
 */
export function calculateFinancialPlan(availableMargin) {
  // The intake form (entrepreneurInputSchema) and the sessionStorage restore
  // guard (analysisSessionState.js) both already reject a non-finite or
  // non-positive margin before it reaches this module through the real UI --
  // but this function is documented as the single source of truth for this
  // arithmetic, so it must not depend on every caller pre-validating.
  // Without this guard, Number(availableMargin) coerces a non-numeric value
  // to NaN (silently producing a scheme object with NaN money fields) and a
  // negative value flows straight through into a "valid" plan with negative
  // rupee figures.
  const numericMargin = Number(availableMargin);
  if (!Number.isFinite(numericMargin) || numericMargin <= 0) {
    return {
      availableMargin,
      marginPercentage: MARGIN_PERCENTAGE,
      projectCost: null,
      agencySharePercentage: AGENCY_SHARE_PERCENTAGE,
      potentialAgencyShare: null,
      eligibleLoan: null,
      totalIdentifiedFunding: null,
      fundingGap: null,
      scheme: null,
      status: INVALID_INPUT_STATUS,
    };
  }

  const marginPaise = toPaise(numericMargin);
  const projectCostPaise = marginPaise * 10;
  const projectCost = fromPaise(projectCostPaise);
  const potentialAgencyShare = fromPaise(Math.round(projectCostPaise * (AGENCY_SHARE_PERCENTAGE / 100)));

  const termCeilingPaise = toPaise(FINANCIAL_SCHEMES.TERM_LOAN.maxProjectCost);

  if (projectCostPaise > termCeilingPaise) {
    return {
      availableMargin,
      marginPercentage: MARGIN_PERCENTAGE,
      projectCost,
      agencySharePercentage: AGENCY_SHARE_PERCENTAGE,
      potentialAgencyShare,
      eligibleLoan: null,
      totalIdentifiedFunding: null,
      fundingGap: null,
      scheme: null,
      status: OUTSIDE_SCHEME_LIMIT_STATUS,
    };
  }

  const microCeilingPaise = toPaise(FINANCIAL_SCHEMES.MICRO_FINANCE.maxProjectCost);
  const scheme = projectCostPaise <= microCeilingPaise ? FINANCIAL_SCHEMES.MICRO_FINANCE : FINANCIAL_SCHEMES.TERM_LOAN;

  const maxLoanPaise = toPaise(scheme.maxLoanAmount);
  const potentialAgencySharePaise = Math.round(projectCostPaise * (AGENCY_SHARE_PERCENTAGE / 100));
  const eligibleLoanPaise = Math.min(potentialAgencySharePaise, maxLoanPaise);
  const totalIdentifiedFundingPaise = marginPaise + eligibleLoanPaise;
  const fundingGapPaise = Math.max(projectCostPaise - totalIdentifiedFundingPaise, 0);

  return {
    availableMargin,
    marginPercentage: MARGIN_PERCENTAGE,
    projectCost,
    agencySharePercentage: AGENCY_SHARE_PERCENTAGE,
    potentialAgencyShare,
    eligibleLoan: fromPaise(eligibleLoanPaise),
    totalIdentifiedFunding: fromPaise(totalIdentifiedFundingPaise),
    fundingGap: fromPaise(fundingGapPaise),
    scheme: { ...scheme },
    status: ELIGIBLE_STATUS,
  };
}

/**
 * The one calculation source for "what would this margin become" -- both
 * the live preview on the input form and the analysis page's headline
 * figure call this instead of each keeping their own `margin * 10`.
 */
export function calculateIndicativeProjectCost(availableMargin) {
  return calculateFinancialPlan(availableMargin).projectCost;
}
