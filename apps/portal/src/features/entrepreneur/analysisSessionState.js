/**
 * Survives a hard refresh on /entrepreneur/analysis without a database or
 * any persistent storage: react-router's location.state lives only in
 * memory (and in the browser's own per-history-entry state, which a literal
 * address-bar reload or an externally-shared link does not carry), so a
 * refresh with nothing else to fall back on redirects the user all the way
 * back to the intake form and discards their in-progress report.
 *
 * sessionStorage is the deliberate choice over any persistent store: it is
 * per-tab, cleared when the tab closes, and never touches Supabase -- exactly
 * "this session's report input," nothing that should outlive it. Only the
 * five report INPUTS are stored here (location, coordinates, category,
 * radius, margin), plus the optional Working Capital Planner figures the
 * entrepreneur types on the Finance tab (see WorkingCapitalPlanner.jsx) --
 * never AI chat history, which stays purely in AdvisorTab's own component
 * state and is never written here.
 *
 * Every read is validated field-by-field before being trusted; a malformed,
 * tampered, or stale-shaped entry is treated as absent, never partially
 * accepted.
 */

const STORAGE_KEY = "kc-entrepreneur-analysis-input";
const STORAGE_VERSION = 1;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const WORKING_CAPITAL_AMOUNT_FIELDS = [
  "monthlyRent",
  "monthlyStaffCost",
  "monthlyUtilities",
  "otherMonthlyExpenses",
  "initialInventory",
];
const WORKING_CAPITAL_RESERVE_OPTIONS = [1, 2, 3, 6];

/**
 * workingCapital is optional -- absent entirely is valid (an analysis
 * before the planner is ever touched, or restored from before this field
 * existed). When present, every amount must be a non-negative finite
 * number and reserveMonths one of the real dropdown options -- same
 * all-or-nothing philosophy as the rest of this file: a malformed
 * sub-object invalidates the whole stored entry rather than being
 * silently partially accepted.
 */
function isValidWorkingCapitalInput(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  for (const field of WORKING_CAPITAL_AMOUNT_FIELDS) {
    const amount = value[field];
    if (!isFiniteNumber(amount) || amount < 0) return false;
  }

  return WORKING_CAPITAL_RESERVE_OPTIONS.includes(value.reserveMonths);
}

function isValidAnalysisInput(value) {
  if (!value || typeof value !== "object") return false;
  if (value.version !== STORAGE_VERSION) return false;

  const { location, businessCategory, radiusKm, availableMargin, workingCapital } = value;

  if (!location || typeof location !== "object") return false;
  if (!isNonEmptyString(location.label) && !isNonEmptyString(location.query)) return false;
  if (!isFiniteNumber(location.latitude) || !isFiniteNumber(location.longitude)) return false;
  if (location.latitude < -90 || location.latitude > 90) return false;
  if (location.longitude < -180 || location.longitude > 180) return false;

  if (!businessCategory || typeof businessCategory !== "object") return false;
  if (!isNonEmptyString(businessCategory.slug)) return false;

  if (!isFiniteNumber(radiusKm) || radiusKm <= 0) return false;
  if (!isFiniteNumber(availableMargin) || availableMargin <= 0) return false;

  if (!isValidWorkingCapitalInput(workingCapital)) return false;

  return true;
}

/**
 * analysisInput: the exact shape EntrepreneurAnalysis.jsx's location.state
 * already carries -- { location: {query, label, latitude, longitude},
 * businessCategory: {slug, name}, radiusKm, availableMargin }.
 */
export function saveAnalysisInput(analysisInput) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...analysisInput }));
  } catch {
    // sessionStorage can throw in private-browsing/storage-restricted
    // contexts -- the report still works from router state in that session,
    // it just won't survive a hard refresh. Not fatal either way.
  }
}

/** Returns the validated analysis input, or null if absent/invalid. */
export function loadAnalysisInput() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidAnalysisInput(parsed)) return null;

    const { version: _version, ...analysisInput } = parsed;
    return analysisInput;
  } catch {
    return null;
  }
}

export function clearAnalysisInput() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
