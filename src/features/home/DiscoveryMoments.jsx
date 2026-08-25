import { ArrowUpRight, Coffee, MoonStar, PartyPopper, Sunrise, ShoppingCart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

const MOMENTS = [
  { title: "Breakfast rush", caption: "Milk, tea, bread & more", query: "milk", icon: Sunrise, style: "from-[#ffd35b] via-[#ffb35c] to-[#f87970]", iconStyle: "bg-white/35" },
  { title: "Chai break", caption: "The shelf staples you reach for", query: "tea", icon: Coffee, style: "from-[#6654df] via-[#8b64ee] to-[#c276ed]", iconStyle: "bg-white/15" },
  { title: "A little celebration", caption: "Snacks, drinks, good mood", query: "chips", icon: PartyPopper, style: "from-[#e83481] via-[#ee4e78] to-[#fa7e5b]", iconStyle: "bg-white/15" },
  { title: "Late-night needs", caption: "Find what is nearby now", query: "biscuits", icon: MoonStar, style: "from-[#223170] via-[#3f4aa0] to-[#7659b7]", iconStyle: "bg-white/15" },
  { title: "Sunday Stocking", caption: "Weekly essentials", query: "rice", icon: ShoppingCart, style: "from-[#10b981] via-[#34d399] to-[#6ee7b7]", iconStyle: "bg-white/15" },
  { title: "Festival Ready", caption: "Sweets and pooja items", query: "ghee", icon: Sparkles, style: "from-[#fbbf24] via-[#fcd34d] to-[#fde68a]", iconStyle: "bg-white/20" },
];

export default function DiscoveryMoments() {
  const sectionRef = useRevealOnScroll();

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-14 sm:py-20" aria-labelledby="moments-heading">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-meta font-bold tracking-[.14em] text-[#e93483] uppercase">Browse by mood</p>
            <h2 id="moments-heading" className="mt-2 text-heading text-ink">What are you picking up?</h2>
          </div>
          <Link to="/search" className="inline-flex items-center gap-1 text-meta font-bold text-primary transition hover:gap-2">Explore everything <ArrowUpRight className="size-4" /></Link>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MOMENTS.map(({ title, caption, query, icon: Icon, style, iconStyle }) => (
            <li key={title}>
              <Link to={`/search?q=${encodeURIComponent(query)}`} className={`group relative isolate block h-full min-h-48 overflow-hidden rounded-panel bg-gradient-to-br ${style} p-5 text-white shadow-[0_12px_30px_rgba(53,38,126,.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(53,38,126,.34)]`}>
                {/* This is a separate decorative layer. Setting backgroundImage inline
                    on the card replaced Tailwind's colour gradient entirely. */}
                <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.22)_1px,transparent_1px)] bg-size-[10px_10px] opacity-55" />
                <span className={`relative z-10 inline-flex size-11 items-center justify-center rounded-2xl ${iconStyle} backdrop-blur-sm transition duration-300 group-hover:rotate-12 group-hover:scale-110`}><Icon className="size-5" /></span>
                <div className="relative z-10 mt-8"><h3 className="text-card">{title}</h3><p className="mt-1 text-meta text-white/90">{caption}</p></div>
                <div className="absolute right-5 bottom-5 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/20 transition duration-300 group-hover:bg-white group-hover:text-primary"><ArrowUpRight className="size-4" /></div>
                <span aria-hidden="true" className="absolute -right-7 -bottom-10 z-0 size-32 rounded-full border-[18px] border-white/15" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
