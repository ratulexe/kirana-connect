import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import NeonBadge from "../../components/common/NeonBadge.jsx";

const QUICK_SEARCHES = [
  { label: "Milk & dairy", query: "milk" },
  { label: "Tea time", query: "tea" },
  { label: "Snack shelf", query: "snacks" },
  { label: "Home essentials", query: "household" },
];

/** A discovery ribbon; it intentionally makes no invented price claims. */
export default function FlashSaleStrip() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#e11d48] via-[#f43f5e] to-[#fb7185] py-4 text-white shadow-md" aria-label="Quick product discovery">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/4 -top-8 size-64 rounded-full bg-white/20 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <NeonBadge variant="live"><Sparkles className="mr-1 size-3" /> LOCAL FINDS</NeonBadge>
          <div className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto py-1">
            {QUICK_SEARCHES.map(({ label, query }) => (
              <Link key={query} to={`/search?q=${encodeURIComponent(query)}`} className="shrink-0 rounded-pill border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <Link to="/search" className="neon-btn shrink-0 inline-flex items-center gap-1.5 rounded-pill border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white hover:text-red-600">
          Browse <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
