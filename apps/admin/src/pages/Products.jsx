import { Link } from "react-router-dom";
import { useState } from "react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useBrands, useCategories, useProducts } from "../features/admin/useAdmin.js";
import { formatPrice } from "../utils/format.js";

function filterValue(value) {
  return value === "any" ? "" : value;
}

function variantSummary(product) {
  const variants = product.variants ?? [];
  if (variants.length === 0) return `${product.unit_label} · MRP ${formatPrice(product.mrp)}`;
  return variants
    .slice(0, 4)
    .map((variant) => `${variant.unit_label} ${formatPrice(variant.mrp)}`)
    .join(" · ");
}

export default function Products() {
  const [filters, setFilters] = useState({ q: "", category_id: "any", brand_id: "any", active: "any" });
  const categories = useCategories();
  const brands = useBrands();
  const products = useProducts({
    q: filters.q,
    category_id: filterValue(filters.category_id),
    brand_id: filterValue(filters.brand_id),
    active: filterValue(filters.active),
    limit: 50,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading text-ink">Products</h1>
          <p className="mt-1 text-body text-ink-muted">
            Manage the canonical catalogue. Store-specific prices stay in inventory.
          </p>
        </div>
        <Button as={Link} to="/products/new">Create product</Button>
      </div>

      <div className="mt-5 grid gap-3 rounded-panel border border-line bg-surface p-4 lg:grid-cols-[1fr_12rem_12rem_10rem]">
        <input
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          placeholder="Search products"
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        />
        <select
          value={filters.category_id}
          onChange={(event) => setFilters({ ...filters, category_id: event.target.value })}
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        >
          <option value="any">Any category</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select
          value={filters.brand_id}
          onChange={(event) => setFilters({ ...filters, brand_id: event.target.value })}
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        >
          <option value="any">Any brand</option>
          {(brands.data ?? []).map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <select
          value={filters.active}
          onChange={(event) => setFilters({ ...filters, active: event.target.value })}
          className="rounded-control border border-line bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-primary focus:outline-none"
        >
          <option value="any">Any state</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {products.isPending ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : products.isError ? (
        <Alert tone="error" title="Could not load products" className="mt-6">
          {products.error?.message ?? "Please try again."}
        </Alert>
      ) : (
        <div className="mt-6 divide-y divide-line-soft rounded-panel border border-line bg-surface">
          {products.data.length === 0 ? (
            <p className="p-6 text-body text-ink-muted">No products match those filters.</p>
          ) : (
            products.data.map((product) => (
              <article key={product.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-card text-ink">{product.name}</h2>
                    <StatusPill tone={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-meta text-ink-muted">
                    {product.category?.name ?? "No category"} · {product.brand?.name ?? "No brand"} · {variantSummary(product)}
                  </p>
                  {(product.variants?.length ?? 0) > 4 ? (
                    <p className="mt-1 text-meta font-semibold text-primary">
                      {product.variants.length - 4} more sizes
                    </p>
                  ) : null}
                </div>
                <Button as={Link} to={`/products/${product.id}/edit`} variant="secondary" size="sm">
                  Edit
                </Button>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
