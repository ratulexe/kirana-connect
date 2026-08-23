import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import Container from "../components/Container.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import Skeleton from "../components/Skeleton.jsx";
import InventoryRow from "../features/inventory/InventoryRow.jsx";
import AddProductPanel from "../features/inventory/AddProductPanel.jsx";
import EmptyInventory from "../features/inventory/EmptyInventory.jsx";
import { useInventory } from "../features/inventory/useInventory.js";

function Summary({ items }) {
  const listed = items.filter((item) => item.is_available).length;
  const soldOut = items.filter((item) => item.stock_status === "out_of_stock").length;

  const stats = [
    { label: "Products", value: items.length },
    { label: "Visible to customers", value: listed },
    { label: "Sold out", value: soldOut },
  ];

  return (
    <dl className="grid grid-cols-3 gap-3">
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

export default function Inventory() {
  const [isAdding, setIsAdding] = useState(false);
  const { data, isPending, isError, error } = useInventory();

  const existingProductIds = useMemo(
    () => new Set((data?.items ?? []).map((item) => item.product.id)),
    [data],
  );

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError) {
    // 403 is the expected answer for a store still awaiting verification, so it
    // gets an explanation rather than an error.
    const pending = error?.status === 403;
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-lg">
          <Alert tone={pending ? "warning" : "error"} title={pending ? "Not available yet" : "Could not load your inventory"}>
            {error?.message ?? "Please try again in a moment."}
          </Alert>
          <Button as={Link} to="/status" variant="secondary" className="mt-5">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to store status
          </Button>
        </div>
      </Container>
    );
  }

  const { store, items } = data;

  return (
    <Container className="py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/status"
            className="inline-flex items-center gap-1 rounded-control py-1 text-meta font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {store.name}
          </Link>
          <h1 className="mt-1 text-heading text-ink">Your products</h1>
          <p className="mt-1.5 text-body text-ink-muted">
            What you stock, and what you charge for it.
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
              <InventoryRow key={item.id} item={item} />
            ))}
          </ul>
        ) : null}
      </div>
    </Container>
  );
}
