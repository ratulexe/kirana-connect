import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Flame, MapPin } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import { useRevealOnScroll } from '../../animations/useRevealOnScroll.js';
import CountdownTimer from '../../components/common/CountdownTimer.jsx';
import NeonBadge from '../../components/common/NeonBadge.jsx';

const DEAL = {
  name: 'Amul Butter 500g',
  category: 'Dairy & Fresh',
  mrp: 280,
  dealPrice: 199,
  off: 29,
  emoji: '🧨',
  query: 'amul butter',
  description: 'Fresh Amul Butter, available at select kirana stores near you at a massive discount today only!',
};

const getMidnight = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return d;
};

export default function DealOfTheDay() {
  const sectionRef = useRevealOnScroll();
  return (
    <section ref={sectionRef} className="py-14 sm:py-20" aria-labelledby="deal-heading">
      <Container>
        <div className="relative overflow-hidden rounded-panel bg-gradient-to-br from-[#4f36d9] via-[#8b5cf6] to-[#ec4899] p-1 shadow-[0_20px_50px_rgba(79,54,217,0.25)]">
          <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-[#261775] via-[#351f96] to-[#4f36d9] p-6 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <NeonBadge variant="deal"><Flame className="size-3 mr-1" />DEAL OF THE DAY</NeonBadge>
                  <span className="text-xs text-white/50">Resets at midnight</span>
                </div>
                <h2 id="deal-heading" className="text-heading text-white">{DEAL.name}</h2>
                <p className="mt-1 text-sm text-white/50">{DEAL.category}</p>
                <p className="mt-3 text-sm text-white/70">{DEAL.description}</p>
                <div className="mt-6 flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs text-white/40 line-through">MRP ₹{DEAL.mrp}</p>
                    <p className="text-4xl font-black text-[#ffd45e]">₹{DEAL.dealPrice}</p>
                  </div>
                  <span className="deal-flash inline-flex items-center gap-1 rounded-xl bg-red-500 px-4 py-2 text-xl font-black text-white">
                    <BadgePercent className="size-5" /> {DEAL.off}% OFF
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs text-white/50 mb-2">Deal ends in:</p>
                  <CountdownTimer endsAt={getMidnight()} />
                </div>
                <Link to={`/search?q=${encodeURIComponent(DEAL.query)}`}
                  className="neon-btn neon-glow-indigo mt-6 inline-flex items-center gap-2 rounded-pill bg-white px-8 py-3.5 font-extrabold text-[#1a0f4f] hover:bg-[#ffd45e]">
                  <MapPin className="size-4" /> Find at nearby store <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="size-48 sm:size-64 rounded-full bg-white/8 border border-white/15 flex items-center justify-center text-8xl sm:text-9xl hologram">
                    {DEAL.emoji}
                  </div>
                  <div className="float-orbit absolute -right-4 -top-4 size-16 rounded-2xl bg-[#ffd45e] flex items-center justify-center">
                    <span className="text-xs font-black text-[#1a0f4f] text-center leading-tight">{DEAL.off}%<br />OFF</span>
                  </div>
                  <div aria-hidden className="absolute inset-0 rounded-full animate-spin-slow border-2 border-dashed border-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
