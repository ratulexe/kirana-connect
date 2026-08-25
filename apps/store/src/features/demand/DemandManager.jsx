import { useNavigate } from "react-router-dom";
import { Megaphone, Plus } from "lucide-react";
import Alert from "../../components/Alert.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import Button from "../../components/Button.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { formatRelativeTime } from "../../utils/format.js";
import { useStoreDemand } from "./useDemand.js";

const EMPTY_ITEMS = [];

function DemandRow({ row, storeId, onAdd }) {
  const { product, variant } = row;

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <ProductImage src={variant.image_url ?? product.image_url} name={product.name} size="sm" />
        <div className="min-w-0">
          <p className="text-card text-ink">{product.name}</p>
          <p className="mt-0.5 text-meta text-ink-muted">
            {variant.unit_label}
            {product.brand ? ` · ${product.brand.name}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[1.0625rem] font-bold tracking-tight text-ink tabular-nums">
            {row.request_count} {row.request_count === 1 ? "request" : "requests"}
          </p>
          <p className="text-meta text-ink-muted">
            within {row.radius_km} km
            {row.latest_requested_at ? ` · last ${formatRelativeTime(row.latest_requested_at)}` : ""}
          </p>
        </div>

        <Button size="sm" onClick={() => onAdd(row, storeId)}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add to store
        </Button>
      </div>
    </li>
  );
}

/**
 * Aggregated, identity-free customer demand near the selected store.
 *
 * Nothing here is a live inventory system: it only ever reads counts the
 * backend already aggregated, and "Add to store" hands off to the existing
 * inventory-add flow rather than creating a second one. The store manager
 * still chooses price, stock and expiry themselves -- clicking a row never
 * lists a product on its own.
 */
export default function DemandManager({ storeId }) {
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useStoreDemand(storeId);
  const items = data?.items ?? EMPTY_ITEMS;

  const handleAdd = (row) => {
    navigate(`/inventory?store_id=${storeId}`, {
      state: { demandSelection: { product: row.product, variant: row.variant } },
    });
  };

  return (
    <section aria-labelledby="demand-title">
      <div>
        <h2 id="demand-title" className="text-section text-ink">
          Customer demand
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          Products nearby customers are looking for that this store doesn&apos;t have yet.
        </p>
      </div>

      <div className="mt-6">
        {isPending ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-card" />
            ))}
          </div>
        ) : isError ? (
          <Alert
            tone={error?.status === 403 ? "warning" : "error"}
            title={error?.status === 403 ? "Demand is not available yet" : "Could not load nearby demand"}
          >
            {error?.message ?? "Please try again in a moment."}
          </Alert>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-panel border border-dashed border-line px-6 py-12 text-center">
            <span className="mb-4 inline-flex size-11 items-center justify-center rounded-pill bg-surface-sunken text-ink-muted">
              <Megaphone className="size-5" aria-hidden="true" />
            </span>
            <p className="text-card text-ink">No unmet demand near this store yet</p>
            <p className="mt-1.5 max-w-sm text-body text-ink-muted">
              When nearby customers request a product no store has, it will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line-soft rounded-panel border border-line bg-surface">
            {items.map((row) => (
              <DemandRow key={row.variant.id} row={row} storeId={storeId} onAdd={handleAdd} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
