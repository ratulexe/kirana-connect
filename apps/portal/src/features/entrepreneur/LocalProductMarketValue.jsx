import { CircleAlert, Info, Package, SearchX, Store, Tags } from "lucide-react";
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

function PriceTable({ products }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-panel border border-line">
      <table className="w-full min-w-[600px] text-left text-meta">
        <caption className="sr-only">
          Observed local prices per product, ranked by number of store observations
        </caption>
        <thead>
          <tr className="border-b border-line bg-surface-sunken text-ink-soft">
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Product</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Observed range</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Median</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">Stores</th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">MRP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {products.map((p) => (
            <tr key={p.productVariantId}>
              <td className="px-3.5 py-2.5 text-ink">
                {p.productName} <span className="text-ink-muted">({p.variantLabel})</span>
                {p.observedSearches ? (
                  <span className="ml-1.5 text-meta text-ink-muted">-- {p.observedSearches} observed searches</span>
                ) : null}
              </td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">
                {p.storesRepresented > 1 ? (
                  `₹${p.minPrice}–₹${p.maxPrice}`
                ) : (
                  <>
                    ₹{p.minPrice}{" "}
                    <span className="text-meta text-ink-muted">(1 store observed, not a range)</span>
                  </>
                )}
              </td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">₹{p.medianPrice}</td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">
                {p.storesRepresented}
                {p.storesRepresented === 1 ? (
                  <span className="ml-1 text-meta text-ink-muted">(single store)</span>
                ) : null}
              </td>
              <td className="px-3.5 py-2.5 tabular-nums text-ink-soft">{p.mrp != null ? `₹${p.mrp}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LocalProductMarketValue({ state }) {
  if (state.status === "loading") {
    return (
    <LoadingInsight label="Comparing prices across nearby stores..." />
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        icon={CircleAlert}
        tone="error"
        title="Could not load local price data"
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
        title="Price analysis is not yet configured for this business category"
        description="An administrator has not yet linked this business category to catalogue product categories."
        className="mt-5"
      />
    );
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Package} value={data.summary.productsWithObservations} label="Products with price observations" />
        <StatCard icon={Tags} value={data.summary.listingsAnalyzed} label="Listings analyzed" />
        <StatCard icon={Store} value={data.summary.storesRepresented} label="Stores represented" />
      </div>

      {data.dataSufficiency === "no-price-data" ? (
        <EmptyState
          icon={SearchX}
          title="No local price observations found"
          description="No participating Kirana Connect store listings were found for this business category within the selected radius."
          className="mt-5"
        />
      ) : (
        <>
          {data.dataSufficiency === "limited-price-data" ? (
            <p className="mt-3 flex items-start gap-2 text-meta text-ink-soft">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              Only a single price observation was found. This is real, but not enough to describe a local
              range.
            </p>
          ) : null}
          <PriceTable products={data.products} />
        </>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line-soft bg-surface-sunken/60 p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="text-meta text-ink-muted">
          <p>
            Observed prices are based on participating Kirana Connect stores within the selected radius and may
            not represent every local retailer.
          </p>
          <p className="mt-1">
            Profitability cannot be inferred because wholesale/acquisition costs are not currently available. A
            new entrant would need to consider this observed range when setting a competitive retail price.
          </p>
        </div>
      </div>
    </div>
  );
}
