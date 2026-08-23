import { useSearchParams } from "react-router-dom";
import { PackageSearch, SearchX } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SearchBar from "../../components/common/SearchBar.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import { useProductSearch } from "../../hooks/useDiscovery.js";
import { useCategories } from "../../hooks/useCategories.js";

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

export default function SearchResults() {
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const { data, isPending, isError, error, isPlaceholderData } = useProductSearch({
    search,
    category,
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
      <div className="mx-auto max-w-2xl">
        <SearchBar
          size="lg"
          defaultValue={search}
          onSubmit={(term) => update({ q: term })}
          placeholder="Search milk, atta, tea, detergent"
        />
      </div>

      <div className="mt-6">
        <CategoryFilter active={category} onSelect={(slug) => update({ category: slug })} />
      </div>

      <div className="mt-6" aria-busy={isPending}>
        <h1 className="text-section text-ink">
          {search ? `Results for "${search}"` : category ? "Browse products" : "All products"}
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
                : "There is nothing in this category yet."
            }
            action={
              search ? (
                <Button variant="secondary" onClick={() => update({ q: null, category: null })}>
                  Clear search
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
