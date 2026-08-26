import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CircleAlert,
  IndianRupee,
  MapPin,
  MapPinCheck,
  MapPinned,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Field from "../../components/common/Field.jsx";
import Button from "../../components/common/Button.jsx";
import LocationAutocompleteInput from "../../components/common/LocationAutocompleteInput.jsx";
import { zodResolver } from "../../lib/zodResolver.js";
import { formatPrice } from "../../utils/format.js";
import {
  BUSINESS_CATEGORIES_FALLBACK,
  DEFAULT_RADIUS_KM,
  RADIUS_OPTIONS,
  entrepreneurInputSchema,
  toEntrepreneurAnalysisInput,
} from "../../features/entrepreneur/schemas.js";
import { calculateIndicativeProjectCost } from "../../features/entrepreneur/financialEngine.js";
import { fetchActiveBusinessCategories } from "../../services/businessCategories.js";
import { fetchLocationCandidates } from "../../services/entrepreneurLocation.js";
import { saveAnalysisInput, loadAnalysisInput } from "../../features/entrepreneur/analysisSessionState.js";

/**
 * Live taxonomy first; the fixed prototype list only if that fetch fails,
 * so a backend hiccup degrades the dropdown instead of blocking the form.
 * Normalized to {name, slug} regardless of source, since the slug is what
 * both this form and the competitor-discovery request actually need.
 */
function useBusinessCategoryOptions() {
  const [state, setState] = useState({ status: "loading", categories: [] });

  useEffect(() => {
    const controller = new AbortController();

    fetchActiveBusinessCategories({ signal: controller.signal })
      .then((categories) => {
        setState({
          status: "loaded",
          categories: categories.map(({ name, slug }) => ({ name, slug })),
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        console.warn("[kirana-connect-portal] business category fetch failed, using fallback list:", error.message);
        setState({ status: "fallback", categories: BUSINESS_CATEGORIES_FALLBACK });
      });

    return () => controller.abort();
  }, []);

  return state;
}

const WHAT_WE_EVALUATE = [
  "Local market demand",
  "Nearby competition",
  "Supply gaps",
  "Market pricing",
  "Business risks",
  "Financial suitability",
];

/**
 * The location-confirmation step, shown only when the geocoder returned more
 * than one plausible place. Nothing here is a guess: every candidate is a
 * real result from the LocationProvider, and analysis never proceeds until
 * the entrepreneur picks one.
 */
function ConfirmLocationStep({ query, candidates, onConfirm, onBack }) {
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-meta font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Edit location
      </button>

      <h3 className="mt-3 text-card text-ink">Confirm your location</h3>
      <p className="mt-1 text-meta text-ink-muted">
        "{query}" matched more than one place. Choose the one you mean.
      </p>

      <ul className="mt-4 grid gap-2">
        {candidates.map((candidate) => (
          <li key={`${candidate.lat},${candidate.lng}`}>
            <button
              type="button"
              onClick={() => onConfirm(candidate)}
              className="flex w-full items-start gap-2.5 rounded-control border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-primary"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="text-body text-ink">{candidate.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EntrepreneurHome() {
  const navigate = useNavigate();
  const categoryOptions = useBusinessCategoryOptions();

  // Read once on mount (not on every render): if the entrepreneur arrived
  // here via "Edit details" from an existing report, this restores what
  // they last submitted so they can tweak one field rather than retyping
  // everything. Absent on a first-ever visit, in which case the form is
  // simply empty as before.
  const [previousInput] = useState(() => loadAnalysisInput());

  // "idle": the normal form. "resolving": location lookup in flight.
  // "confirming": show ConfirmLocationStep. "not-found" / "lookup-error":
  // an inline message, form still visible so the query can be edited.
  const [locationState, setLocationState] = useState({ status: "idle" });
  const [pendingValues, setPendingValues] = useState(null);
  // A real autocomplete pick, carrying coordinates already -- cleared the
  // moment the visible text no longer matches what was selected, so a
  // manual edit after picking a suggestion can never analyze stale
  // coordinates against new text (see handleLocationQueryChange below).
  // Pre-seeded from the restored previous input so re-submitting without
  // touching the location field reuses its real coordinates instead of
  // re-geocoding text that never changed.
  const [selectedLocation, setSelectedLocation] = useState(() =>
    previousInput
      ? {
          label: previousInput.location.label ?? previousInput.location.query,
          latitude: previousInput.location.latitude,
          longitude: previousInput.location.longitude,
        }
      : null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(entrepreneurInputSchema),
    defaultValues: {
      locationQuery: previousInput?.location.label ?? previousInput?.location.query ?? "",
      availableMargin: previousInput?.availableMargin ? String(previousInput.availableMargin) : "",
      businessCategorySlug: previousInput?.businessCategory.slug ?? "",
      radiusKm: previousInput?.radiusKm ?? DEFAULT_RADIUS_KM,
    },
  });

  // The category <select> only has real <option> elements once
  // categoryOptions finishes its async fetch -- at mount time (while it's
  // still "loading") the restored businessCategorySlug default has nothing
  // to match, and a native <select> silently falls back to whichever
  // <option> happens to render first once the real list arrives. Re-applying
  // the restored value after the list loads corrects that; a no-op when
  // there is no previousInput to restore.
  useEffect(() => {
    if (!previousInput) return;
    if (categoryOptions.status === "loading") return;
    setValue("businessCategorySlug", previousInput.businessCategory.slug, { shouldValidate: false });
  }, [categoryOptions.status, previousInput, setValue]);

  const watchedMargin = watch("availableMargin");
  const marginNumber = Number(watchedMargin);
  const indicativeProjectSize =
    Number.isFinite(marginNumber) && marginNumber > 0 ? calculateIndicativeProjectCost(marginNumber) : null;

  const watchedLocationQuery = watch("locationQuery");

  function handleLocationQueryChange(text) {
    setValue("locationQuery", text, { shouldValidate: false });
    // The text no longer matches what was selected -- the coordinates are
    // now stale and must not be reused silently.
    setSelectedLocation((current) => (current && text !== current.label ? null : current));
  }

  function handleLocationSelect(suggestion) {
    setValue("locationQuery", suggestion.label, { shouldValidate: true });
    setSelectedLocation(suggestion);
  }

  // True only while the chosen suggestion still matches the field's text --
  // the same condition that decides whether its coordinates may be reused,
  // so the confirmed chip can never show for a stale selection.
  const isLocationConfirmed = Boolean(selectedLocation && selectedLocation.label === watchedLocationQuery);

  function clearSelectedLocation() {
    setSelectedLocation(null);
    setValue("locationQuery", "", { shouldValidate: false });
  }

  const proceedToAnalysis = (values, resolvedLocation) => {
    const businessCategory = categoryOptions.categories.find((c) => c.slug === values.businessCategorySlug) ?? {
      slug: values.businessCategorySlug,
      name: values.businessCategorySlug,
    };

    const analysisInput = toEntrepreneurAnalysisInput({
      values,
      businessCategory,
      location: {
        query: values.locationQuery,
        label: resolvedLocation.label,
        latitude: resolvedLocation.lat,
        longitude: resolvedLocation.lng,
      },
    });

    // Written before navigating so a hard refresh on the analysis page can
    // restore these same inputs -- see analysisSessionState.js.
    saveAnalysisInput(analysisInput);

    navigate("/entrepreneur/analysis", { state: analysisInput });
  };

  const resolveLocation = async (values) => {
    // The user picked a real autocomplete suggestion and never edited it
    // since -- coordinates are already known, so skip geocoding entirely
    // rather than re-resolving text that was never actually changed.
    if (selectedLocation && selectedLocation.label === values.locationQuery) {
      proceedToAnalysis(values, { label: selectedLocation.label, lat: selectedLocation.latitude, lng: selectedLocation.longitude });
      return;
    }

    setPendingValues(values);
    setLocationState({ status: "resolving" });

    try {
      const candidates = await fetchLocationCandidates(values.locationQuery);

      if (candidates.length === 0) {
        setLocationState({ status: "not-found" });
        return;
      }
      if (candidates.length === 1) {
        setLocationState({ status: "idle" });
        proceedToAnalysis(values, candidates[0]);
        return;
      }
      setLocationState({ status: "confirming", candidates });
    } catch (error) {
      setLocationState({ status: "lookup-error", message: error.message });
    }
  };

  const confirmCandidate = (candidate) => {
    setLocationState({ status: "idle" });
    if (pendingValues) proceedToAnalysis(pendingValues, candidate);
  };

  const isResolving = locationState.status === "resolving";
  const showForm = locationState.status !== "confirming";

  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-sunken px-3 py-1.5 text-meta font-semibold text-primary">
          <Briefcase className="size-3.5" aria-hidden="true" />
          Entrepreneur
        </p>
        <h1 className="mt-4 text-heading text-balance text-ink">
          Discover the Right Business Opportunity Around You
        </h1>
        <p className="mt-3 text-body text-ink-muted">
          Evaluate local demand, competition, market gaps and financial suitability before starting your business.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <section
          aria-labelledby="start-a-business-heading"
          className="rounded-panel border border-line bg-surface p-5 shadow-subtle sm:p-7"
        >
          <h2 id="start-a-business-heading" className="text-section text-ink">
            Start a Business
          </h2>

          {showForm ? (
            <form onSubmit={handleSubmit(resolveLocation)} noValidate className="mt-5 grid gap-5">
              <Field
                label="Where do you want to start your business?"
                required
                error={errors.locationQuery?.message}
                hint="Start typing to see real address suggestions, or enter the village/town, block, and district."
              >
                {(field) =>
                  isLocationConfirmed ? (
                    // A single-line <input> inevitably clips a full resolved
                    // address ("Esplanade, Kolkata - 700001, WB, India"), and
                    // that address is the one thing the entrepreneur most
                    // needs to verify before running the analysis. Once a
                    // location is actually chosen the field is replaced by a
                    // block that wraps it in full, with Change to go back to
                    // searching.
                    <span className="flex items-start gap-2 rounded-control border border-success/40 bg-success-soft px-3 py-2.5">
                      <MapPinCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span className="min-w-0 flex-1 text-body break-words text-ink">
                        {selectedLocation.label}
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedLocation}
                        className="shrink-0 rounded-control px-2 py-0.5 text-meta font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        Change
                      </button>
                    </span>
                  ) : (
                    <span
                      className={`relative flex h-11 items-center gap-2 rounded-control border bg-surface px-3 focus-within:border-primary ${
                        errors.locationQuery ? "border-danger" : "border-line"
                      }`}
                    >
                      <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                      <LocationAutocompleteInput
                        id={field.id}
                        aria-invalid={field["aria-invalid"]}
                        aria-describedby={field["aria-describedby"]}
                        name="locationQuery"
                        value={watchedLocationQuery ?? ""}
                        onChange={handleLocationQueryChange}
                        onSelect={handleLocationSelect}
                        placeholder="Enter your preferred location"
                      />
                    </span>
                  )
                }
              </Field>

              {locationState.status === "not-found" ? (
                <p className="-mt-2 flex items-start gap-1.5 text-meta text-danger">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  No matching location was found. Check the spelling, or add a district/state for a more specific
                  search.
                </p>
              ) : null}
              {locationState.status === "lookup-error" ? (
                <p className="-mt-2 flex items-start gap-1.5 text-meta text-danger">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {locationState.message ?? "Could not look up that location. Please try again."}
                </p>
              ) : null}

              <Field
                label="Available Margin Capital"
                required
                error={errors.availableMargin?.message}
                hint="Enter the amount you can contribute from your own funds."
              >
                {(field) => (
                  <span
                    className={`flex h-11 items-center gap-2 rounded-control border bg-surface px-3 focus-within:border-primary ${
                      errors.availableMargin ? "border-danger" : "border-line"
                    }`}
                  >
                    <IndianRupee className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <input
                      {...field}
                      {...register("availableMargin")}
                      type="text"
                      inputMode="decimal"
                      placeholder="1,00,000"
                      className="min-w-0 flex-1 bg-transparent text-body tabular-nums text-ink outline-none placeholder:text-ink-muted"
                    />
                  </span>
                )}
              </Field>

              {indicativeProjectSize ? (
                <p className="-mt-2 flex items-center gap-1.5 text-meta font-semibold text-primary">
                  <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                  Indicative Project Size: {formatPrice(indicativeProjectSize)}
                </p>
              ) : null}

              <Field label="Business Category" required error={errors.businessCategorySlug?.message}>
                {(field) => (
                  <span
                    className={`flex h-11 items-center gap-2 rounded-control border bg-surface px-3 focus-within:border-primary ${
                      errors.businessCategorySlug ? "border-danger" : "border-line"
                    }`}
                  >
                    <Briefcase className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <select
                      {...field}
                      {...register("businessCategorySlug")}
                      defaultValue=""
                      disabled={categoryOptions.status === "loading"}
                      className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none disabled:text-ink-muted"
                    >
                      <option value="" disabled>
                        {categoryOptions.status === "loading" ? "Loading categories..." : "Choose a category"}
                      </option>
                      {categoryOptions.categories.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </Field>
              {categoryOptions.status === "fallback" ? (
                <p className="-mt-2 flex items-center gap-1.5 text-meta text-ink-muted">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                  Could not load the live category list -- showing a standard set instead.
                </p>
              ) : null}

              <Field label="Analysis Radius" required error={errors.radiusKm?.message}>
                {(field) => (
                  <span
                    className={`flex h-11 items-center gap-2 rounded-control border bg-surface px-3 focus-within:border-primary ${
                      errors.radiusKm ? "border-danger" : "border-line"
                    }`}
                  >
                    <MapPinned className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <select
                      {...field}
                      {...register("radiusKm")}
                      className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none"
                    >
                      {RADIUS_OPTIONS.map((km) => (
                        <option key={km} value={km}>
                          Within {km} km
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </Field>

              <Button type="submit" size="lg" fullWidth isLoading={isSubmitting || isResolving} className="mt-1">
                <TrendingUp className="size-4" aria-hidden="true" />
                {isResolving ? "Finding your location..." : "Analyse Opportunity"}
              </Button>
            </form>
          ) : (
            <ConfirmLocationStep
              query={pendingValues?.locationQuery ?? ""}
              candidates={locationState.candidates}
              onConfirm={confirmCandidate}
              onBack={() => setLocationState({ status: "idle" })}
            />
          )}
        </section>

        <aside
          aria-labelledby="what-we-evaluate-heading"
          className="rounded-panel border border-line bg-surface-sunken p-5 sm:p-7"
        >
          <h2 id="what-we-evaluate-heading" className="text-card text-ink">
            Your report will evaluate
          </h2>
          <ul className="mt-4 grid gap-3">
            {WHAT_WE_EVALUATE.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-body text-ink-soft">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-meta text-ink-muted">
            <MapPinCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Your location is looked up only when you submit the form, and is used solely to run this analysis --
            it is not saved to your account.
          </p>
        </aside>
      </div>
    </Container>
  );
}
