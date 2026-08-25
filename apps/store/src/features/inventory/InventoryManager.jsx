import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import InventoryRow from "./InventoryRow.jsx";
import AddProductPanel from "./AddProductPanel.jsx";
import EmptyInventory from "./EmptyInventory.jsx";
import { useInventory } from "./useInventory.js";

const STATUS_FILTERS = [
  { value: "all", label: "All products" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Sold out" },
  { value: "expiring_soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
];
const EMPTY_ITEMS = [];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

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
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isPending, isError, error } = useInventory(storeId);
  const items = data?.items ?? EMPTY_ITEMS;

  const existingVariantIds = useMemo(
    () => new Set(items.map((item) => item.product_variant_id ?? item.variant?.id)),
    [items],
  );
  const visibleItems = useMemo(() => {
    const query = normalize(productSearch);

    return items.filter((item) => {
      const product = item.product;
      const matchesSearch =
        !query ||
        [product.name, product.brand?.name, product.category?.name, product.unit_label, item.variant?.unit_label]
          .map(normalize)
          .some((value) => value.includes(query));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "visible" && item.is_available) ||
        (statusFilter === "hidden" && !item.is_available) ||
        (statusFilter === "expiring_soon" &&
          (item.expiry_status === "expiring_soon" || item.expiry_status === "expires_today")) ||
        (statusFilter === "expired" && item.expiry_status === "expired") ||
        item.stock_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, productSearch, statusFilter]);

  const clearFilters = () => {
    setProductSearch("");
    setStatusFilter("all");
  };

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

      {items.length > 0 ? (
        <div className="mt-6 grid gap-3 rounded-panel border border-line bg-surface p-4 sm:grid-cols-[minmax(14rem,1fr)_auto] sm:items-end">
          <label className="min-w-0">
            <span className="text-meta font-semibold text-ink-soft">Search your products</span>
            <span className="mt-1 flex h-10 items-center gap-2 rounded-control border border-line bg-canvas px-3 focus-within:border-primary">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Product, brand, or category"
                className="min-w-0 flex-1 bg-transparent text-meta text-ink outline-none placeholder:text-ink-muted"
              />
            </span>
          </label>

          <label>
            <span className="text-meta font-semibold text-ink-soft">Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 h-10 rounded-control border border-line bg-surface px-2.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {isAdding ? (
        <div className="mt-6">
          <AddProductPanel
            existingVariantIds={existingVariantIds}
            storeId={storeId}
            onClose={() => setIsAdding(false)}
          />
        </div>
      ) : null}

      <div className="mt-6">
        {items.length === 0 && !isAdding ? (
          <EmptyInventory onAdd={() => setIsAdding(true)} />
        ) : visibleItems.length === 0 ? (
          <Alert title="No listed products match those filters">
            <button
              type="button"
              onClick={clearFilters}
              className="mt-1 font-semibold text-primary underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          </Alert>
        ) : items.length > 0 ? (
          <ul className="divide-y divide-line-soft rounded-panel border border-line bg-surface">
            {visibleItems.map((item) => (
              <InventoryRow key={item.id} item={item} storeId={storeId} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
