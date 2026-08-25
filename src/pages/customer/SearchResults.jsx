import { useSearchParams } from "react-router-dom";
import { LocateFixed, MapPin, PackageSearch, SearchX, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import { useNearbyStores, useProductSearch } from "../../hooks/useDiscovery.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useLocationStore } from "../../store/locationStore.js";
import { formatDistance } from "../../utils/format.js";

const PAGE_SIZE = 24;

function ResultsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-64 rounded-card" />
        </li>
      ))}
    </ul>
  );
}

/** Category chips, so browsing is possible without knowing what to type. */
function CategoryFilter({ active, onSelect }) {
  const { data: categories } = useCategories();
  if (!categories?.length) return null;

  return (
    <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
      <li>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={!active}
          className={`rounded-pill border px-3.5 py-1.5 text-meta font-semibold whitespace-nowrap transition-colors ${
            !active
              ? "border-primary bg-primary text-primary-fg"
              : "border-line bg-surface text-ink-soft hover:border-ink-muted"
          }`}
        >
          All
        </button>
      </li>
      {categories.map((category) => (
        <li key={category.id}>
          <button
            type="button"
            onClick={() => onSelect(category.slug)}
            aria-pressed={active === category.slug}
            className={`rounded-pill border px-3.5 py-1.5 text-meta font-semibold whitespace-nowrap transition-colors ${
              active === category.slug
                ? "border-primary bg-primary text-primary-fg"
                : "border-line bg-surface text-ink-soft hover:border-ink-muted"
            }`}
          >
            {category.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function StoreFilter({ activeStoreId, onSelect, onClear }) {
  const { location, status, detect, radiusKm } = useLocationStore();
  const stores = useNearbyStores({ location, radiusKm, limit: 10 });
  const list = stores.data?.stores ?? [];

  return (
    <section aria-labelledby="store-filter-heading" className="rounded-panel border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="store-filter-heading" className="text-card text-ink">
            Shop by store
          </h2>
          <p className="mt-0.5 text-meta text-ink-muted">
            {location ? `Nearest stores within ${radiusKm} km` : "Choose a location to see nearest stores"}
          </p>
        </div>

        {!location ? (
          <Button variant="secondary" size="sm" onClick={detect} isLoading={status === "locating"}>
            <LocateFixed className="size-4" aria-hidden="true" />
            {status === "locating" ? "Finding you..." : "Use location"}
          </Button>
        ) : activeStoreId ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            All stores
          </Button>
        ) : null}
      </div>

      {location ? (
        <div className="mt-3" aria-busy={stores.isPending}>
          {stores.isPending ? (
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-16 min-w-52 rounded-card" />
              ))}
            </div>
          ) : null}

          {stores.isError ? (
            <p className="text-meta text-danger">
              Could not load nearby stores. Please try again.
            </p>
          ) : null}

          {!stores.isPending && !stores.isError && list.length === 0 ? (
            <p className="text-meta text-ink-muted">No verified stores found nearby yet.</p>
          ) : null}

          {list.length > 0 ? (
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
              {list.map((store) => {
                const selected = activeStoreId === store.id;
                return (
                  <li key={store.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(store.id)}
                      aria-pressed={selected}
                      className={`min-w-52 rounded-card border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-fg"
                          : "border-line bg-canvas text-ink hover:border-primary/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-meta font-semibold">
                        <Store className="size-3.5" aria-hidden="true" />
                        {store.name}
                      </span>
                      <span
                        className={`mt-1 flex items-center gap-1.5 text-meta ${
                          selected ? "text-primary-fg/80" : "text-ink-muted"
                        }`}
                      >
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {store.distance_km !== null ? `${formatDistance(store.distance_km)} away` : store.locality}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function SearchResults() {
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const brand = params.get("brand") ?? "";
  const storeId = params.get("store_id") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const { location, radiusKm } = useLocationStore();

  const { data, isPending, isError, error, isPlaceholderData } = useProductSearch({
    search,
    category,
    brand,
    storeId,
    location,
    radiusKm,
    limit: PAGE_SIZE,
    offset,
  });

  const update = (changes) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any change to the query resets paging; page 3 of a different search is
    // never what someone means.
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const products = data?.products ?? [];
  const total = data?.meta?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Container className="py-8 sm:py-12">
      <StoreFilter
        activeStoreId={storeId}
        onSelect={(id) => update({ store_id: id })}
        onClear={() => update({ store_id: null })}
      />

      <div className="mt-6">
        <CategoryFilter active={category} onSelect={(slug) => update({ category: slug })} />
      </div>

      <div className="mt-6" aria-busy={isPending}>
        <h1 className="text-section text-ink">
          {search
            ? `Results for "${search}"`
            : storeId
              ? "Products from this store"
              : brand
                ? "Products by brand"
              : category
                ? "Browse products"
                : "All products"}
        </h1>
        {!isPending && !isError ? (
          <p className="mt-1 text-meta text-ink-muted">
            {total === 0
              ? "Nothing found"
              : `${total} product${total === 1 ? "" : "s"} in the catalogue`}
          </p>
        ) : null}
      </div>

      <div className={`mt-5 ${isPlaceholderData ? "opacity-60" : ""}`}>
        {isPending ? <ResultsSkeleton /> : null}

        {isError ? (
          <EmptyState
            tone="error"
            icon={PackageSearch}
            title="Could not load products"
            description={error?.message ?? "Please try again in a moment."}
          />
        ) : null}

        {!isPending && !isError && products.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No products match that"
            description={
              search
                ? `Nothing in the catalogue matches "${search}". Try a shorter word, or browse a category.`
                : brand
                  ? "No products from this brand are available yet."
                : "There is nothing in this category yet."
            }
            action={
              search || brand ? (
                <Button variant="secondary" onClick={() => update({ q: null, brand: null, category: null })}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : null}

        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        ) : null}
      </div>

      {lastPage > 1 ? (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span className="text-meta text-ink-muted tabular-nums">
            Page {page} of {lastPage}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </Container>
  );
}
