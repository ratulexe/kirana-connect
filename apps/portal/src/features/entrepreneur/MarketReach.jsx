import { CircleAlert, ListChecks, MapPinned, Ruler, Users } from "lucide-react";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadingInsight from "../../components/common/LoadingInsight.jsx";

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <Icon className="size-4 text-primary" aria-hidden="true" />
      <p className="mt-2 text-card font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-meta text-ink-muted">{label}</p>
    </div>
  );
}

/** Renders the shared market-reach fetch state (see useMarketReach.js). */
export default function MarketReach({ state }) {
  if (state.status === "loading") {
    return (
    <LoadingInsight label="Measuring your market reach..." />
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Could not load market reach"
        description={state.message ?? "Please try again in a moment."}
        className="mt-5"
      />
    );
  }

  const { data } = state;

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Ruler} value={`${data.radiusKm} km`} label="Analysis radius" />
        <StatCard icon={MapPinned} value={`${data.marketAreaSqKm} km²`} label="Market area (π × radius²)" />
        <StatCard
          icon={Users}
          value={data.population.status === "available" ? data.population.estimatedPopulation.toLocaleString("en-IN") : "—"}
          label="Estimated consumer population"
        />
      </div>

      {data.population.status === "available" ? (
        <p className="mt-2 text-meta text-ink-muted">
          Source: {data.population.source} ({data.population.referenceYear}). {data.population.methodology}
        </p>
      ) : (
        <p className="mt-2 text-meta text-ink-muted">
          Population estimate unavailable from currently configured demographic sources.
        </p>
      )}

      {data.distributionChannels.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-card text-ink">
            <ListChecks className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Typical channels for this business category
          </h3>
          <p className="mt-1 text-meta text-ink-muted">
            General guidance for this type of business, not channels observed at this specific location.
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {data.distributionChannels.map((channel) => (
              <li
                key={channel}
                className="rounded-control border border-line-soft bg-surface px-3.5 py-2 text-meta text-ink-soft"
              >
                {channel}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
