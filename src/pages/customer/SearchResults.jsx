import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock3, LayoutGrid, LocateFixed, MapPin, PackageSearch, SearchX, Store } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import ConsumerSearchBar from "../../components/common/ConsumerSearchBar.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import { useNearbyStores, useProductSearch } from "../../hooks/useDiscovery.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useRecentSearches } from "../../hooks/useRecentSearches.js";
import { useLocationStore } from "../../store/locationStore.js";
import { formatDistance } from "../../utils/format.js";
import { recordConsumerSearchEvent } from "../../services/searchEvents.js";

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

/**
 * Pre-type suggestion: the device's own recent searches, one tap to redo.
 * There is no "popular searches" chip alongside it -- that would need a
 * backend aggregation of search_events that does not exist yet, and
 * inventing the numbers is exactly the kind of dark pattern this pass rules
 * out. Only shown while the field is empty, and only once there is history.
 */
function RecentSearches({ terms, onSelect, onClear }) {
  if (!terms.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-meta font-semibold text-ink-muted">
          <Clock3 className="size-3.5" aria-hidden="true" />
          Recent searches
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-meta font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          Clear
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {terms.map((term) => (
          <li key={term}>
            <button
              type="button"
              onClick={() => onSelect(term)}
              className="rounded-pill border border-line bg-surface px-3.5 py-1.5 text-meta font-semibold text-ink-soft transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Did you mean this category / this shop" -- shown above the raw product
 * grid whenever the typed query matches a category name or a nearby store's
 * name, each with an arrow to jump straight there. Store matching reuses the
 * same nearby-stores list StoreFilter already fetches (location-gated, same
 * as everywhere else in this app) rather than a separate "search all shops"
 * endpoint that doesn't exist yet.
 */
function MatchSuggestions({ query, onSelectCategory, onSelectStore }) {
  const { data: categories } = useCategories();
  const { location, radiusKm } = useLocationStore();
  const stores = useNearbyStores({ location, radiusKm, limit: 30 });

  const term = query.trim().toLowerCase();
  if (term.length < 2) return null;

  const matchedCategory = categories?.find((category) => category.name.toLowerCase().includes(term));
  const matchedStores = (stores.data?.stores ?? [])
    .filter((store) => store.name.toLowerCase().includes(term))
    .slice(0, 3);

  if (!matchedCategory && matchedStores.length === 0) return null;

  return (
    <div className="mb-6 divide-y divide-line-soft overflow-hidden rounded-card border border-line bg-surface">
      {matchedCategory ? (
        <button
          type="button"
          onClick={() => onSelectCategory(matchedCategory.slug)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
        >
          <span className="flex items-center gap-2.5 text-[0.9375rem] font-semibold text-ink">
            <LayoutGrid className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {matchedCategory.name}
            <span className="text-meta font-normal text-ink-muted">in Categories</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>
      ) : null}
      {matchedStores.map((store) => (
        <button
          key={store.id}
          type="button"
          onClick={() => onSelectStore(store.id)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
        >
          <span className="flex items-center gap-2.5 text-[0.9375rem] font-semibold text-ink">
            <Store className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {store.name}
            <span className="text-meta font-normal text-ink-muted">in Shops</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>
      ))}
    </div>
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
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const brand = params.get("brand") ?? "";
  const storeId = params.get("store_id") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const { location, radiusKm } = useLocationStore();
  const { recent: recentSearches, addSearch: addRecentSearch, clear: clearRecentSearches } = useRecentSearches();

  const { data, isPending, isFetching, isError, error, isPlaceholderData } = useProductSearch({
    search,
    category,
    brand,
    storeId,
    location,
    radiusKm,
    limit: PAGE_SIZE,
    offset,
  });

  const update = (changes, { replace = false } = {}) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any change to the query resets paging; page 3 of a different search is
    // never what someone means.
    if (!("page" in changes)) next.delete("page");
    setParams(next, { replace });
  };

  // Search-as-you-type: the field itself is instant (never debounced), only
  // the URL/query it drives is. `replace: true` on the resulting URL update
  // is what keeps four keystrokes from becoming four entries the back button
  // has to fight through -- a plain `setParams` call here defaults to push.
  const [queryInput, setQueryInput] = useState(search);
  const debouncedQuery = useDebouncedValue(queryInput, 220);

  // Keeps the field in sync with URL changes that did not originate from
  // typing here -- a quick-search chip elsewhere, browser back/forward, or a
  // fresh /search?q=... link.
  useEffect(() => {
    setQueryInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedQuery === search) return;
    update({ q: debouncedQuery || null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const products = data?.products ?? [];
  const total = data?.meta?.total ?? 0;
  const nearbyStoreCount = data?.meta?.nearby_store_count ?? null;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // One intentional completed search -> one search event, no more, no less.
  // Keyed on the trimmed search text only, not on category/brand/store/page,
  // so changing a filter or turning a page on the same search text never
  // logs again. The ref survives React StrictMode's dev-only double effect
  // invocation (same component instance, not a real remount), so the second
  // invocation always finds loggedSearchRef already set and skips -- the same
  // pattern ScrollToTop.jsx uses for its own once-per-value guard. Clearing
  // the ref when the query goes empty means a later re-search of the exact
  // same term is correctly treated as a new event rather than suppressed.
  const loggedSearchRef = useRef(null);
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      loggedSearchRef.current = null;
      return;
    }
    // isPlaceholderData means `data` is still the PREVIOUS query's result
    // shown while this one loads -- waiting it out avoids logging a new
    // search's event using the old search's total/products.
    if (isPending || isError || isPlaceholderData) return;
    if (loggedSearchRef.current === trimmed) return;
    loggedSearchRef.current = trimmed;
    addRecentSearch(trimmed);

    // Only link a product/category when the search unambiguously resolved to
    // exactly one catalogue product -- never guessed from free text.
    const singleMatch = total === 1 && products.length === 1 ? products[0] : null;

    recordConsumerSearchEvent({
      search_query: trimmed,
      result_count: total,
      available_store_count: location ? nearbyStoreCount : null,
      radius_km: location ? radiusKm : null,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      product_id: singleMatch?.id ?? null,
      category_id: singleMatch?.category?.id ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isPending, isError, isPlaceholderData, data]);

  return (
    <>
      {/*
        /search owns the entire top bar on this route -- SiteHeader renders
        nothing here (see the onSearchPage check there), so this single
        compact row (back button + the live search field) replaces the
        promo strip/logo/category-nav stack entirely, the way Zepto/
        Instamart's search screen does. Sticky at the very top since there
        is no site header above it to offset for anymore.
      */}
      <div className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-[0_6px_24px_rgba(49,36,118,.05)] backdrop-blur-2xl">
        <Container className="flex items-center gap-2 py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to home"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <ConsumerSearchBar
            mode="live"
            size="md"
            value={queryInput}
            onChange={setQueryInput}
            isLoading={isFetching}
            autoFocus={false}
            className="flex-1 border border-line bg-white shadow-float"
          />
        </Container>
      </div>

      <Container className="py-6 sm:py-8">
      {search ? (
        <MatchSuggestions
          query={search}
          onSelectCategory={(slug) => update({ category: slug })}
          onSelectStore={(id) => update({ store_id: id })}
        />
      ) : null}

      {!search ? (
        <div className="mt-6">
          <RecentSearches
            terms={recentSearches}
            onSelect={(term) => {
              setQueryInput(term);
              update({ q: term });
            }}
            onClear={clearRecentSearches}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <StoreFilter
          activeStoreId={storeId}
          onSelect={(id) => update({ store_id: id })}
          onClear={() => update({ store_id: null })}
        />
      </div>

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
    </>
  );
}
