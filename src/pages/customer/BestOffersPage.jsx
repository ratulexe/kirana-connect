import { Link } from "react-router-dom";
import { BadgePercent, MapPin, Sparkles } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import Button from "../../components/common/Button.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";
import PriceDisplay from "../../components/common/PriceDisplay.jsx";
import { useBestOffers } from "../../hooks/useDiscovery.js";

const PAGE_SIZE = 24;

function OfferCard({ offer }) {
  const offPercentage = Math.round(offer.savings_percentage);

  return (
    <li>
      <Link
        to={`/product/${offer.product.slug}?store=${encodeURIComponent(offer.store.slug)}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-card border border-[#e4dccd] bg-[#fffdf8] p-3 shadow-[0_8px_24px_rgba(51,65,48,.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_30px_rgba(21,122,85,.14)]"
      >
        <div className="relative overflow-hidden rounded-control border border-[#eee5d7] bg-gradient-to-br from-[#fff7df] via-[#f8f4e9] to-[#e5f3ea] p-1">
          <ProductImage src={offer.product.image_url} name={offer.product.name} size="lg" />
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-pill bg-red-500 px-2 py-1 text-[.65rem] font-bold tracking-wide text-white shadow-sm">
            <BadgePercent className="size-2.5" /> {offPercentage}% OFF
          </span>
        </div>

        <div className="mt-3 flex flex-1 flex-col">
          <h3 className="line-clamp-2 text-[0.9375rem] font-semibold text-ink">{offer.product.name}</h3>
          <p className="mt-1 text-meta text-ink-muted">{offer.product.unit_label}</p>

          <div className="mt-auto pt-3">
            <PriceDisplay price={offer.selling_price} mrp={offer.mrp} size="sm" showSavings={false} />
            <p className="mt-1.5 flex items-center gap-1 text-meta font-semibold text-ink-soft">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{offer.store.name}</span>
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}

function OffersSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-64 rounded-card" />
        </li>
      ))}
    </ul>
  );
}

/** Every real markdown against MRP, biggest discount first -- not a single spotlighted deal. */
export default function BestOffersPage() {
  const { data, isPending, isError, error, isPlaceholderData } = useBestOffers({ limit: PAGE_SIZE, offset: 0 });
  const offers = data?.offers ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Container className="py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-panel bg-gradient-to-br from-[#e11d48] via-[#f43f5e] to-[#be123c] p-7 text-white shadow-lg sm:p-10">
        <div aria-hidden="true" className="absolute -left-12 top-1/2 size-72 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-meta font-bold tracking-[.13em] text-[#ffec9d] uppercase">
            <Sparkles className="size-3.5" /> Real markdowns, ranked
          </p>
          <h1 className="mt-3 text-heading text-white">Best offers right now</h1>
          <p className="mt-2 max-w-xl text-body text-white/75">
            Every listing currently priced meaningfully below its MRP, biggest discount first. Each card opens straight to that store&apos;s offer.
          </p>
        </div>
      </section>

      <section className="mt-8" aria-live="polite" aria-busy={isPending}>
        {isPending ? <OffersSkeleton /> : null}

        {isError ? (
          <EmptyState
            tone="error"
            icon={BadgePercent}
            title="Could not load best offers"
            description={error?.message ?? "Please try again shortly."}
          />
        ) : null}

        {!isPending && !isError && offers.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title="No real markdowns right now"
            description="Once a store prices something meaningfully below MRP, it shows up here."
            action={
              <Button as={Link} to="/search">
                Browse products
              </Button>
            }
          />
        ) : null}

        {offers.length > 0 ? (
          <>
            <p className="mb-3 text-meta text-ink-muted">{total} real {total === 1 ? "offer" : "offers"} right now</p>
            <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${isPlaceholderData ? "opacity-60" : ""}`}>
              {offers.map((offer) => (
                <OfferCard key={`${offer.store.slug}-${offer.product.slug}`} offer={offer} />
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </Container>
  );
}
