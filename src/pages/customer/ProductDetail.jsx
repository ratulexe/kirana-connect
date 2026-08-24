import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, LocateFixed, Search, Store as StoreIcon } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import StoreOffer from "../../features/product/StoreOffer.jsx";
import ProductGallery from "../../components/product/ProductGallery.jsx";
import BrandProducts from "../../components/product/BrandProducts.jsx";
import { useProduct, useProductOffers } from "../../hooks/useDiscovery.js";
import { useLocationStore } from "../../store/locationStore.js";
import { formatPrice } from "../../utils/format.js";

const RADIUS_OPTIONS = [2, 5, 10, 25];
const STOCK_OPTIONS = [
  { value: "all", label: "All stock" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
];
const EMPTY_OFFERS = [];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function initials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function BrandExploreCard({ brand }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = brand.logo_url && !logoFailed;

  return (
    <Link
      to={`/search?brand=${encodeURIComponent(brand.slug)}`}
      className="mt-5 flex max-w-md items-center gap-3 rounded-card border border-line bg-canvas p-3 transition-[border-color,background-color] hover:border-primary/45 hover:bg-primary-soft"
    >
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-card border border-line-soft bg-surface">
        {showLogo ? (
          <img
            src={brand.logo_url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setLogoFailed(true)}
            className="size-full object-contain p-1"
          />
        ) : (
          <span aria-hidden="true" className="text-meta font-bold text-ink-muted">
            {initials(brand.name)}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-card text-ink">{brand.name}</span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-meta font-semibold text-primary">
          Explore all products
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function OffersSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 rounded-card" />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { location, status, detect, radiusKm, sort, setRadius, setSort } = useLocationStore();
  const [shopSearch, setShopSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [dealsOnly, setDealsOnly] = useState(false);

  const product = useProduct(slug);
  const offers = useProductOffers({ slug, location, radiusKm, sort });
  const list = offers.data?.offers ?? EMPTY_OFFERS;
  const filteredOffers = useMemo(() => {
    const query = normalize(shopSearch);

    return list.filter((offer) => {
      const store = offer.store;
      const matchesSearch =
        !query ||
        [store.name, store.locality, store.city, store.address_line_1]
          .map(normalize)
          .some((value) => value.includes(query));
      const matchesStock = stockFilter === "all" || offer.stock_status === stockFilter;
      const matchesDeal = !dealsOnly || Number(offer.savings ?? 0) > 0;

      return matchesSearch && matchesStock && matchesDeal;
    });
  }, [dealsOnly, list, shopSearch, stockFilter]);
  const filteredPriceRange = useMemo(() => {
    if (filteredOffers.length === 0) return null;
    const prices = filteredOffers.map((offer) => Number(offer.selling_price));
    return {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
    };
  }, [filteredOffers]);

  if (product.isPending) {
    return (
      <Container className="py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-40 rounded-card" />
        <Skeleton className="mt-6 h-64 rounded-card" />
      </Container>
    );
  }

  if (product.isError) {
    return (
      <Container className="py-16">
        <EmptyState
          tone={product.error?.status === 404 ? "neutral" : "error"}
          icon={StoreIcon}
          title={product.error?.status === 404 ? "Product not found" : "Could not load this product"}
          description={product.error?.message ?? "Please try again in a moment."}
          action={
            <Button as={Link} to="/search">
              Browse products
            </Button>
          }
          className="mx-auto max-w-lg"
        />
      </Container>
    );
  }

  const item = product.data;
  const summary = offers.data?.meta;

  const clearOfferFilters = () => {
    setShopSearch("");
    setStockFilter("all");
    setDealsOnly(false);
  };

  return (
    <Container className="py-8 sm:py-10">
      <Link
        to="/search"
        className="inline-flex items-center gap-1.5 rounded-control py-1 text-meta font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All products
      </Link>

      <div className="mt-4 flex flex-col gap-5 rounded-panel border border-line bg-surface p-5 sm:flex-row sm:items-start sm:gap-7 sm:p-7">
        <ProductGallery
          media={item.media}
          legacyImageUrl={item.image_url}
          productName={item.name}
        />

        <div className="min-w-0">
          {item.brand ? (
            <p className="text-meta font-semibold text-ink-muted">{item.brand.name}</p>
          ) : null}
          <h1 className="mt-1 text-heading text-balance text-ink">{item.name}</h1>
          <p className="mt-2 text-body text-ink-soft">
            {item.unit_label}
            <span aria-hidden="true"> &middot; </span>
            MRP <span className="font-semibold tabular-nums">{formatPrice(item.mrp)}</span>
          </p>
          {item.description ? (
            <p className="mt-3 max-w-prose text-body text-ink-muted">{item.description}</p>
          ) : null}
          <p className="mt-3 text-meta text-ink-muted">
            In {item.category.name}
          </p>
          {item.brand ? <BrandExploreCard brand={item.brand} /> : null}
        </div>
      </div>

      <section aria-labelledby="offers-heading" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="offers-heading" className="text-section text-ink">
              Where to buy it
            </h2>
            <p className="mt-1 text-meta text-ink-muted">
              {location
                ? `Shops within ${radiusKm} km, ${sort === "price" ? "cheapest first" : "nearest first"}.`
                : "Every shop stocking this, cheapest first. Set your location to see distances."}
            </p>
          </div>

          {!location ? (
            <Button variant="secondary" size="sm" onClick={detect} isLoading={status === "locating"}>
              <LocateFixed className="size-4" aria-hidden="true" />
              {status === "locating" ? "Finding you..." : "Nearest stores"}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4 lg:grid-cols-[minmax(14rem,1fr)_auto_auto] lg:items-end">
          <label className="min-w-0">
            <span className="text-meta font-semibold text-ink-soft">Search shops</span>
            <span className="mt-1 flex h-10 items-center gap-2 rounded-control border border-line bg-canvas px-3 focus-within:border-primary">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={shopSearch}
                onChange={(event) => setShopSearch(event.target.value)}
                placeholder="Store name or locality"
                className="min-w-0 flex-1 bg-transparent text-meta text-ink outline-none placeholder:text-ink-muted"
              />
            </span>
          </label>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-end">
            {location ? (
              <>
                <label>
                  <span className="text-meta font-semibold text-ink-soft">Distance</span>
                  <select
                    value={radiusKm}
                    onChange={(event) => setRadius(Number(event.target.value))}
                    className="mt-1 h-10 w-full rounded-control border border-line bg-surface px-2.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none lg:w-auto"
                  >
                    {RADIUS_OPTIONS.map((km) => (
                      <option key={km} value={km}>
                        Within {km} km
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-meta font-semibold text-ink-soft">Sort</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="mt-1 h-10 w-full rounded-control border border-line bg-surface px-2.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none lg:w-auto"
                  >
                    <option value="distance">Nearest first</option>
                    <option value="price">Cheapest first</option>
                  </select>
                </label>
              </>
            ) : null}

            <label>
              <span className="text-meta font-semibold text-ink-soft">Stock</span>
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-control border border-line bg-surface px-2.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none lg:w-auto"
              >
                {STOCK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="inline-flex h-10 min-w-0 items-center gap-2 rounded-control border border-line bg-canvas px-3 text-meta font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={dealsOnly}
              onChange={(event) => setDealsOnly(event.target.checked)}
              className="size-4 accent-primary"
            />
            Deals only
          </label>
        </div>

        <div className="mt-5" aria-busy={offers.isPending}>
          {offers.isPending ? <OffersSkeleton /> : null}

          {offers.isError ? (
            <EmptyState
              tone="error"
              icon={StoreIcon}
              title="Could not load shops"
              description={offers.error?.message ?? "Please try again in a moment."}
            />
          ) : null}

          {!offers.isPending && !offers.isError && list.length === 0 ? (
            <EmptyState
              icon={StoreIcon}
              title={location ? "No shop nearby has this yet" : "No shop has this listed yet"}
              description={
                location
                  ? `No verified shop within ${radiusKm} km lists this product. Try a wider radius.`
                  : "Once a nearby shop lists this product, it will appear here with their price."
              }
              action={
                location && radiusKm < 25 ? (
                  <Button variant="secondary" onClick={() => setRadius(25)}>
                    Search within 25 km
                  </Button>
                ) : null
              }
            />
          ) : null}

          {!offers.isPending && !offers.isError && list.length > 0 && filteredOffers.length === 0 ? (
            <EmptyState
              icon={StoreIcon}
              title="No shops match those filters"
              description="Clear the shop search, stock, or deal filters to see all available stores."
              action={
                <Button variant="secondary" onClick={clearOfferFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : null}

          {filteredOffers.length > 0 ? (
            <>
              {filteredPriceRange && summary?.store_count > 1 ? (
                <p className="mb-3 text-meta text-ink-soft">
                  Showing {filteredOffers.length} of {summary.store_count} shops, from{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPrice(filteredPriceRange.lowest)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPrice(filteredPriceRange.highest)}
                  </span>
                </p>
              ) : null}

              <ul className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
                {filteredOffers.map((offer) => (
                  <StoreOffer key={offer.store.id} offer={offer} mrp={item.mrp} />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      <BrandProducts brand={item.brand} currentProductSlug={slug} />
    </Container>
  );
}
