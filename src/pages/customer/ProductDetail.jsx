import { Link, useParams } from "react-router-dom";
import { ArrowLeft, LocateFixed, Store as StoreIcon } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Button from "../../components/common/Button.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";
import StoreOffer from "../../features/product/StoreOffer.jsx";
import { useProduct, useProductOffers } from "../../hooks/useDiscovery.js";
import { useLocationStore } from "../../store/locationStore.js";
import { formatPrice } from "../../utils/format.js";

const RADIUS_OPTIONS = [2, 5, 10, 25];

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

  const product = useProduct(slug);
  const offers = useProductOffers({ slug, location, radiusKm, sort });

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
  const list = offers.data?.offers ?? [];
  const summary = offers.data?.meta;

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
        <ProductImage
          src={item.image_url}
          name={item.name}
          size="xl"
          className="sm:h-40 sm:w-40 sm:shrink-0"
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

          {location ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-meta text-ink-muted">
                <span className="sr-only">Search radius</span>
                <select
                  value={radiusKm}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none"
                >
                  {RADIUS_OPTIONS.map((km) => (
                    <option key={km} value={km}>
                      Within {km} km
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-meta text-ink-muted">
                <span className="sr-only">Sort offers by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-meta font-semibold text-ink focus:border-primary focus:outline-none"
                >
                  <option value="price">Cheapest first</option>
                  <option value="distance">Nearest first</option>
                </select>
              </label>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={detect} isLoading={status === "locating"}>
              <LocateFixed className="size-4" aria-hidden="true" />
              {status === "locating" ? "Finding you..." : "Show distances"}
            </Button>
          )}
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

          {list.length > 0 ? (
            <>
              {summary?.lowest_price != null && summary.store_count > 1 ? (
                <p className="mb-3 text-meta text-ink-soft">
                  {summary.store_count} shops, from{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPrice(summary.lowest_price)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold tabular-nums">
                    {formatPrice(summary.highest_price)}
                  </span>
                </p>
              ) : null}

              <ul className="divide-y divide-line-soft overflow-hidden rounded-panel border border-line bg-surface">
                {list.map((offer) => (
                  <StoreOffer key={offer.store.id} offer={offer} mrp={item.mrp} />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </Container>
  );
}
