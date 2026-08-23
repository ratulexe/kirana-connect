import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import InventoryRow from "./InventoryRow.jsx";
import AddProductPanel from "./AddProductPanel.jsx";
import EmptyInventory from "./EmptyInventory.jsx";
import { useInventory } from "./useInventory.js";

function Summary({ items }) {
  const listed = items.filter((item) => item.is_available).length;
  const soldOut = items.filter((item) => item.stock_status === "out_of_stock").length;

  const stats = [
    { label: "Products", value: items.length },
    { label: "Visible to customers", value: listed },
    { label: "Sold out", value: soldOut },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-card border border-line bg-surface px-4 py-3">
          <dt className="text-meta text-ink-muted">{stat.label}</dt>
          <dd className="mt-0.5 text-[1.375rem] font-bold tracking-tight text-ink tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function InventoryManager({ compact = false, storeId }) {
  const [isAdding, setIsAdding] = useState(false);
  const { data, isPending, isError, error } = useInventory(storeId);

  const existingProductIds = useMemo(
    () => new Set((data?.items ?? []).map((item) => item.product.id)),
    [data],
  );

  if (isPending) {
    return (
      <div>
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const pending = error?.status === 403;
    return (
      <Alert
        tone={pending ? "warning" : "error"}
        title={pending ? "Products are not available yet" : "Could not load your products"}
      >
        {error?.message ?? "Please try again in a moment."}
      </Alert>
    );
  }

  const { items } = data;

  return (
    <section className={compact ? "" : "mt-6"} aria-labelledby="inventory-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="inventory-title" className="text-section text-ink">
            Manage products
          </h2>
          <p className="mt-1.5 text-body text-ink-muted">
            Add products you stock, set your shop price, and control what customers can see.
          </p>
        </div>

        {!isAdding ? (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add product
          </Button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mt-6">
          <Summary items={items} />
        </div>
      ) : null}

      {isAdding ? (
        <div className="mt-6">
          <AddProductPanel
            existingProductIds={existingProductIds}
            storeId={storeId}
            onClose={() => setIsAdding(false)}
          />
        </div>
      ) : null}

      <div className="mt-6">
        {items.length === 0 && !isAdding ? (
          <EmptyInventory onAdd={() => setIsAdding(true)} />
        ) : items.length > 0 ? (
          <ul className="divide-y divide-line-soft rounded-panel border border-line bg-surface">
            {items.map((item) => (
              <InventoryRow key={item.id} item={item} storeId={storeId} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
