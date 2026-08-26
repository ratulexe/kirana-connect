import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CircleAlert,
  Globe,
  Info,
  MapPinned,
  SearchX,
  Store,
  TriangleAlert,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import LoadingInsight from "../../components/common/LoadingInsight.jsx";
import { fetchCompetitors } from "../../services/competitors.js";

// Leaflet + react-leaflet are a meaningful chunk of the analysis page's JS
// weight for a component that only ever renders when there is at least one
// mapped competitor to plot. Splitting it into its own chunk lets it load in
// parallel with (rather than blocking) the rest of the analysis bundle.
const CompetitorMap = lazy(() => import("./CompetitorMap.jsx"));

const SOURCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "kirana-connect", label: "Kirana Connect" },
  { value: "openstreetmap", label: "External" },
];

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <Icon className="size-4 text-primary" aria-hidden="true" />
      <p className="mt-2 text-card font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-meta text-ink-muted">{label}</p>
    </div>
  );
}

function SourceBadge({ source }) {
  const isKiranaConnect = source === "kirana-connect";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-meta font-semibold ${
        isKiranaConnect ? "bg-primary-soft text-primary" : "bg-[#c07a1f]/12 text-[#8a5a15]"
      }`}
    >
      {isKiranaConnect ? (
        <Store className="size-3 shrink-0" aria-hidden="true" />
      ) : (
        <MapPinned className="size-3 shrink-0" aria-hidden="true" />
      )}
      {isKiranaConnect ? "Kirana Connect" : "External map"}
    </span>
  );
}

function CompetitorRow({ competitor }) {
  const isKiranaConnect = competitor.source === "kirana-connect";
  return (
    <li className="flex items-start justify-between gap-3 rounded-control border border-line-soft px-3.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-body font-semibold text-ink">
          {competitor.name ?? (
            <span className="font-normal text-ink-muted">
              Unnamed mapped {(competitor.businessCategory ?? "").toLowerCase() || "business"}
            </span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
          <span className="tabular-nums">{competitor.distanceKm.toFixed(2)} km away</span>
          {isKiranaConnect ? (
            <span className="text-ink-soft">
              {competitor.competitionRelation === "primary" ? "Primary competitor" : "Overlapping competitor"}
            </span>
          ) : (
            <span className="text-ink-soft">Mapped as {competitor.externalType ?? "shop"}</span>
          )}
        </p>
      </div>
      <SourceBadge source={competitor.source} />
    </li>
  );
}

export default function CompetitorMapping({ location, radiusKm, businessCategory }) {
  const [state, setState] = useState({ status: "loading" });
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    setSourceFilter("all");

    fetchCompetitors({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      categorySlug: businessCategory.slug,
      signal: controller.signal,
    })
      .then((data) => setState({ status: "loaded", data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", message: error.message });
      });

    return () => controller.abort();
  }, [location.latitude, location.longitude, radiusKm, businessCategory.slug]);

  const filteredCompetitors = useMemo(() => {
    if (state.status !== "loaded") return [];
    if (sourceFilter === "all") return state.data.competitors;
    return state.data.competitors.filter((c) => c.source === sourceFilter);
  }, [state, sourceFilter]);

  if (state.status === "loading") {
    return (
    <LoadingInsight label="Finding nearby businesses on the map..." />
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Could not load competitor data"
        description={state.message ?? "Please try again in a moment."}
        className="mt-5"
      />
    );
  }

  const { summary, competitors, externalProviderStatus, location: resolvedLocation } = state.data;
  const center = [resolvedLocation.latitude, resolvedLocation.longitude];

  return (
    <div className="mt-5">
      {externalProviderStatus === "unavailable" ? (
        <p className="mb-4 flex items-start gap-2 rounded-card border border-warning/30 bg-warning-soft px-3.5 py-3 text-meta text-ink-soft">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          External mapped businesses are temporarily unavailable. Kirana Connect store results are still shown.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Building2} value={summary.mappedCompetitors} label="Mapped competitors" />
        <StatCard icon={Store} value={summary.kiranaConnectCompetitors} label="Kirana Connect" />
        <StatCard icon={Globe} value={summary.externalCompetitors} label="External map listings" />
        <StatCard
          icon={MapPinned}
          value={`${summary.competitionDensityPerSqKm.toFixed(2)} / km²`}
          label="Competition density"
        />
      </div>
      {summary.unnamedExternalBusinesses > 0 ? (
        <p className="mt-2 text-meta text-ink-muted">
          Includes {summary.unnamedExternalBusinesses} unnamed mapped{" "}
          {summary.unnamedExternalBusinesses === 1 ? "business" : "businesses"} in the count above.
        </p>
      ) : null}

      {competitors.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching competitors found"
          description="No matching competitors were identified in the currently available Kirana Connect and mapped external data within this radius."
          className="mt-5"
        />
      ) : (
        <>
          <div className="mt-5">
            <Suspense fallback={<Skeleton className="h-80 sm:h-96" />}>
              <CompetitorMap center={center} radiusKm={radiusKm} competitors={competitors} />
            </Suspense>
          </div>

          {SOURCE_FILTERS.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter competitors by source">
              {SOURCE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSourceFilter(filter.value)}
                  aria-pressed={sourceFilter === filter.value}
                  className={`rounded-pill border px-3 py-1.5 text-meta font-semibold transition-colors ${
                    sourceFilter === filter.value
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-line bg-surface text-ink-soft hover:border-ink-muted"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="mt-3 grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
            {filteredCompetitors.map((competitor) => (
              <CompetitorRow key={competitor.id} competitor={competitor} />
            ))}
          </ul>
        </>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-soft bg-surface-sunken/60 p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="text-meta text-ink-muted">
          <p className="font-semibold text-ink-soft">About this competitor data</p>
          <p className="mt-1">
            Kirana Connect stores are registered stores with first-party platform data. External businesses are
            publicly mapped businesses from OpenStreetMap. Map coverage may not include every real-world
            business, so these are mapped competitors identified in currently available data, not an exhaustive
            count.
          </p>
          <p className="mt-1.5">External business/map data: © OpenStreetMap contributors.</p>
        </div>
      </div>
    </div>
  );
}
