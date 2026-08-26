import {
  CircleAlert,
  ClipboardList,
  Info,
  MapPinned,
  Megaphone,
  Search,
  Store,
  TrendingDown,
} from "lucide-react";
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

function formatPercent(rate) {
  if (rate === null || rate === undefined) return "—";
  return `${Math.round(rate * 1000) / 10}%`;
}

function TopUnmetTable({ rows }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-panel border border-line">
      <table className="w-full min-w-[560px] text-left text-meta">
        <caption className="sr-only">Frequently unmet search queries, most unmet occurrences first</caption>
        <thead>
          <tr className="border-b border-line bg-surface-sunken text-ink-soft">
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Search</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Observed searches</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Unmet occurrences</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Avg. nearby stores</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((row) => (
            <tr key={row.query}>
              <td className="px-3.5 py-2.5 text-ink">{row.query}</td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{row.searches}</td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{row.unmetSearches}</td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">
                {row.averageAvailableStoreCount ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupplySnapshot({ supply }) {
  return (
    <div className="mt-5">
      <h3 className="text-card text-ink">Participating Supply Snapshot</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatCard icon={Store} value={supply.participatingStores} label="Kirana Connect stores" />
        <StatCard icon={ClipboardList} value={supply.relevantProductsAvailable} label="Relevant products" />
        <StatCard icon={MapPinned} value={supply.activeListings} label="Listings" />
      </div>
      <p className="mt-2 text-meta text-ink-muted">
        Supply figures reflect participating Kirana Connect stores and do not represent every offline business
        in the area.
      </p>
    </div>
  );
}

function AboutThisAnalysis({ periodDays }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-soft bg-surface-sunken/60 p-3.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
      <div className="text-meta text-ink-muted">
        <p className="font-semibold text-ink-soft">About this analysis</p>
        <p className="mt-1">
          <strong className="text-ink-soft">Demand</strong> is prototype observed Consumer Platform search
          activity from the last {periodDays} days -- a small, real sample from this prototype's own usage, not
          audited historical market demand. <strong className="text-ink-soft">Supply</strong> is current
          participating Kirana Connect store inventory. <strong className="text-ink-soft">Competition</strong>{" "}
          combines Kirana Connect stores and publicly mapped external businesses -- external competitor
          inventory is unknown and is never counted as known supply.
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the shared demand-supply fetch state (see useDemandSupply.js).
 * Lifted so the Feasibility Assessment section can reuse the exact same
 * fetched data instead of requesting it a second time.
 */
export default function DemandSupplyGap({ state }) {
  if (state.status === "loading") {
    return (
    <LoadingInsight label="Checking local demand and available supply..." />
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Could not load demand-supply analysis"
        description={state.message ?? "Please try again in a moment."}
        className="mt-5"
      />
    );
  }

  const { data } = state;

  if (data.analysisStatus === "category-mapping-unavailable") {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Demand analysis is not yet configured for this business category"
        description="An administrator has not yet linked this business category to catalogue product categories, so demand and supply cannot be calculated for it yet."
        className="mt-5"
      />
    );
  }

  const periodDays = data.period.days;

  return (
    <div className="mt-5">
      <p className="text-meta font-semibold text-ink-soft">Demand period: Last {periodDays} days</p>

      {data.dataSufficiency === "no-data" ? (
        <>
          <EmptyState
            icon={Search}
            title="Not enough search activity recorded yet"
            description="Not enough Kirana Connect search activity has been recorded in this area yet to calculate local demand."
            className="mt-3"
          />
          <SupplySnapshot supply={data.supply} />
        </>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Search} value={data.demand.totalRelevantSearches} label="Observed searches" />
            <StatCard icon={TrendingDown} value={data.demand.unmetDemandEvents} label="Unmet search events" />
            <StatCard icon={CircleAlert} value={formatPercent(data.demand.unmetDemandRate)} label="Unmet demand rate" />
            <StatCard icon={Store} value={data.supply.participatingStores} label="Participating supply (stores)" />
          </div>

          {data.topUnmetQueries.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-card text-ink">Frequently unmet searches</h3>
              <p className="mt-1 text-meta text-ink-muted">
                Observed unmet demand signals, not guaranteed business opportunities.
              </p>
              <TopUnmetTable rows={data.topUnmetQueries} />
            </div>
          ) : null}

          {data.unclassifiedUnmetQueries.length > 0 ? (
            <div className="mt-5">
              <h3 className="text-card text-ink">Unclassified unmet demand</h3>
              <p className="mt-1 text-meta text-ink-muted">
                Zero-result searches that could not be matched to a specific product or category. These are not
                counted in the metrics above and may be reviewed for classification later.
              </p>
              <ul className="mt-3 grid gap-1.5">
                {data.unclassifiedUnmetQueries.map((row) => (
                  <li
                    key={row.query}
                    className="flex items-center justify-between rounded-control border border-line-soft px-3.5 py-2 text-meta"
                  >
                    <span className="text-ink">{row.query}</span>
                    <span className="tabular-nums text-ink-muted">{row.searches} searches</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.explicitProductRequests > 0 ? (
            <p className="mt-4 flex items-start gap-2 text-meta text-ink-soft">
              <Megaphone className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
              {data.explicitProductRequests} customer{data.explicitProductRequests === 1 ? " has" : "s have"} also
              explicitly requested a specific unavailable product in this area during this period.
            </p>
          ) : null}

          <SupplySnapshot supply={data.supply} />
        </>
      )}

      <AboutThisAnalysis periodDays={periodDays} />
    </div>
  );
}
