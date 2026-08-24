import { Link } from "react-router-dom";
import { useState } from "react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Skeleton from "../components/Skeleton.jsx";
import StatusPill from "../components/StatusPill.jsx";
import DeleteProductDialog from "../components/DeleteProductDialog.jsx";
import { Trash2 } from "lucide-react";
import { useBrands, useCategories, useProducts, useProductSummary, useDeleteProduct } from "../features/admin/useAdmin.js";
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

function ProductsSummary({ summary, filters, onCategory }) {
  if (summary.isPending) {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }

  if (summary.isError) {
    return (
      <Alert tone="error" title="Could not load product counts" className="mt-5">
        {summary.error?.message ?? "Please try again."}
      </Alert>
    );
  }

  const data = summary.data;
  const stats = [
    { label: "Total products", value: data.total },
    { label: "Active products", value: data.active },
    { label: "Inactive products", value: data.inactive },
  ];

  return (
    <section className="mt-5 grid gap-4" aria-labelledby="product-counts-heading">
      <h2 id="product-counts-heading" className="sr-only">Product counts</h2>

      <dl className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-line bg-surface px-4 py-3">
            <dt className="text-meta font-semibold text-ink-muted">{stat.label}</dt>
            <dd className="mt-1 text-[1.5rem] font-bold tracking-tight text-ink tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-panel border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-card text-ink">Category-wise products</h3>
          {filters.category_id !== "any" ? (
            <button
              type="button"
              onClick={() => onCategory("any")}
              className="text-meta font-semibold text-primary underline-offset-4 hover:underline"
            >
              Show all
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {(data.categories ?? []).map((category) => {
            const selected = filters.category_id === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategory(category.id)}
                aria-pressed={selected}
                className={`rounded-card border px-3 py-2 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary-soft text-ink"
                    : "border-line-soft bg-canvas text-ink hover:border-primary/40"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-meta font-semibold">{category.name}</span>
                  <span className="text-[1rem] font-bold tabular-nums">{category.total}</span>
                </span>
                <span className="mt-1 block text-meta text-ink-muted">
                  {category.active} active · {category.inactive} inactive
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Products() {
  const [filters, setFilters] = useState({ q: "", category_id: "any", brand_id: "any", active: "any" });
  const [productToDelete, setProductToDelete] = useState(null);
  const deleteMutation = useDeleteProduct();
  const categories = useCategories();
  const brands = useBrands();
  const productSummary = useProductSummary();
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

      <ProductsSummary
        summary={productSummary}
        filters={filters}
        onCategory={(categoryId) => setFilters({ ...filters, category_id: categoryId })}
      />

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
                <div className="flex gap-2">
                  <Button as={Link} to={`/products/${product.id}/edit`} variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-error hover:bg-error/10 hover:text-error"
                    title="Delete product"
                    onClick={() => {
                      deleteMutation.reset();
                      setProductToDelete(product);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      <DeleteProductDialog
        product={productToDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        onClose={() => setProductToDelete(null)}
        onConfirm={async (id) => {
          try {
            await deleteMutation.mutateAsync(id);
            setProductToDelete(null);
          } catch {
            // Error is handled and displayed in the dialog
          }
        }}
      />
    </div>
  );
}
