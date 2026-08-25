import { Link } from "react-router-dom";
import { ArrowRight, BadgePercent, Sparkles } from "lucide-react";
import NeonBadge from "../../components/common/NeonBadge.jsx";
import { useBestOffers } from "../../hooks/useDiscovery.js";

const TICKER_SIZE = 10;

/** A discovery ribbon whose moving ticker is real best-offer data, never invented placeholder deals. */
export default function FlashSaleStrip() {
  const { data } = useBestOffers({ limit: TICKER_SIZE, offset: 0 });
  const offers = data?.offers ?? [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] py-4 text-white shadow-md" aria-label="Best offers ticker">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/4 -top-8 size-64 rounded-full bg-white/20 blur-3xl" />
      <div className="relative flex items-center gap-4 px-4 sm:px-8">
        <NeonBadge variant="live" className="shrink-0"><Sparkles className="mr-1 size-3" /> LOCAL FINDS</NeonBadge>

        <div className="min-w-0 flex-1 overflow-hidden">
          {offers.length > 0 ? (
            <div className="pulse-track flex w-max items-center">
              {[...offers, ...offers].map((offer, index) => (
                <Link
                  key={`${offer.store.slug}-${offer.product.slug}-${index}`}
                  to={`/product/${offer.product.slug}?store=${encodeURIComponent(offer.store.slug)}`}
                  className="group mx-3 inline-flex shrink-0 items-center gap-2 rounded-pill border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition hover:bg-white/25"
                >
                  <span className="rounded-pill bg-white/90 px-1.5 py-0.5 text-[0.65rem] font-black text-red-600">
                    {Math.round(offer.savings_percentage)}% OFF
                  </span>
                  <span className="max-w-[10rem] truncate">{offer.product.name}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <Link to="/best-offers" className="neon-btn shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-red-600">
          <BadgePercent className="size-3.5" /> Best offers <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
