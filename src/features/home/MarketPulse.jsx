import { BadgeCheck, CircleDot, MapPin, Sparkles, Zap, TrendingUp, Heart, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";

const PULSE_ITEMS = [
  { label: "Fresh stock updates", count: "124 today", query: "milk", icon: CircleDot },
  { label: "Compare prices nearby", count: "100% free", query: "atta", icon: BadgeCheck },
  { label: "Walkable local finds", count: "< 5 mins", query: "biscuits", icon: MapPin },
  { label: "Everyday picks", count: "Top rated", query: "tea", icon: Sparkles },
  { label: "Flash deals", count: "Live now", query: "sugar", icon: Zap },
  { label: "Trending items", count: "Rising", query: "coffee", icon: TrendingUp },
  { label: "Weekend specials", count: "Save 20%", query: "chips", icon: PartyPopper },
  { label: "Local favourites", count: "In demand", query: "bread", icon: Heart },
];

export default function MarketPulse() {
  return (
    <section className="relative z-10 overflow-hidden bg-gradient-to-r from-[#ffe566] via-[#ffd45e] to-[#ffbe3b] text-[#21165e] shadow-sm border-y border-[#f3aa12]/30" aria-label="Kirana Connect highlights">
      <div className="pulse-track flex w-max items-center py-2.5">
        {[...PULSE_ITEMS, ...PULSE_ITEMS].map(({ label, count, query, icon: Icon }, index) => (
          <Link key={`${label}-${index}`} to={`/search?q=${encodeURIComponent(query)}`} className="group mx-5 inline-flex items-center gap-2.5 text-meta font-bold tracking-wide whitespace-nowrap sm:mx-7">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#21165e] text-[#ffd45e] shadow-sm transition group-hover:scale-110"><Icon className="size-3.5" /></span>
            <div className="flex items-center gap-1.5"><span className="group-hover:underline text-[#21165e] font-extrabold">{label}</span><span className="rounded-pill bg-[#21165e]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[#21165e]">{count}</span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
