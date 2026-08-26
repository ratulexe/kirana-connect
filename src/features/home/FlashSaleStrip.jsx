import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useBestOffers } from "../../hooks/useDiscovery.js";
import { useWishlist } from "../../hooks/useWishlist.js";

const TICKER_SIZE = 10;
// The strict top-10-by-discount is naturally a narrow band -- the catalogue's
// real markdowns happen to cluster tightly at the very top (the honest data
// really does have several offers within a point of each other around 50%),
// so always showing exactly the top 10 made the ticker look like it was
// repeating one number. Sampling from a wider real pool instead keeps every
// percentage genuine while actually varying what's shown.
const POOL_SIZE = 40;

function sampleRandom(list, count) {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** A discovery ribbon whose moving ticker is real best-offer data, never invented placeholder deals. */
export default function FlashSaleStrip() {
  const { data } = useBestOffers({ limit: POOL_SIZE, offset: 0 });
  // Re-samples only when the underlying data actually changes (staleTime
  // keeps that infrequent, and `data` is a stable reference between
  // fetches), not on every render -- otherwise the ticker would visibly
  // reshuffle mid-scroll.
  const offers = useMemo(() => sampleRandom(data?.offers ?? [], TICKER_SIZE), [data]);
  const { isSaved, toggle } = useWishlist();

  if (offers.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#e93483] via-[#7c3aed] to-[#4f36d9] py-4 text-white shadow-md" aria-label="Best offers ticker">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/4 -top-8 size-64 rounded-full bg-white/20 blur-3xl" />
      <div className="relative min-w-0 overflow-hidden px-4 sm:px-8">
        <div className="pulse-track flex w-max items-center">
          {[...offers, ...offers].map((offer, index) => {
            const saved = isSaved(offer.product.id);
            return (
              <Link
                key={`${offer.store.slug}-${offer.product.slug}-${index}`}
                to={`/product/${offer.product.slug}?store=${encodeURIComponent(offer.store.slug)}`}
                className="group mx-3 inline-flex shrink-0 items-center gap-2 rounded-pill border border-white/25 bg-white/15 py-1.5 pr-1.5 pl-3 text-xs font-bold whitespace-nowrap transition hover:bg-white/25"
              >
                <span className="rounded-pill bg-white/90 px-1.5 py-0.5 text-[0.65rem] font-black text-primary">
                  {Math.round(offer.savings_percentage)}% OFF
                </span>
                <span className="max-w-[10rem] truncate">{offer.product.name}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggle(offer.product.id);
                  }}
                  aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={saved}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/35"
                >
                  <Heart className={`size-3.5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
