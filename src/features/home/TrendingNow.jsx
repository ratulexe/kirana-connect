import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, TrendingUp } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import { useRevealOnScroll } from '../../animations/useRevealOnScroll.js';

const TRENDING = [
  { rank: 1, name: 'Amul Dahi', category: 'Dairy', searches: '2.4k', query: 'dahi' },
  { rank: 2, name: 'Britannia Marie', category: 'Biscuits', searches: '1.9k', query: 'marie biscuits' },
  { rank: 3, name: 'Surf Excel', category: 'Household', searches: '1.7k', query: 'surf excel' },
  { rank: 4, name: 'Haldirams Mix', category: 'Snacks', searches: '1.5k', query: 'haldirams' },
  { rank: 5, name: 'Colgate 150g', category: 'Personal Care', searches: '1.3k', query: 'colgate' },
  { rank: 6, name: 'Maggi Noodles', category: 'Instant Food', searches: '1.2k', query: 'maggi' },
  { rank: 7, name: 'Tata Salt 1kg', category: 'Grocery', searches: '1.1k', query: 'tata salt' },
  { rank: 8, name: 'Parle-G', category: 'Biscuits', searches: '980', query: 'parleg' },
];

const RANK_COLORS = { 1: 'text-yellow-500 bg-yellow-50', 2: 'text-slate-400 bg-slate-50', 3: 'text-orange-600 bg-orange-50' };

export default function TrendingNow() {
  const sectionRef = useRevealOnScroll();
  return (
    <section ref={sectionRef} className="py-14 sm:py-20" aria-labelledby="trending-heading">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-meta font-bold tracking-[.14em] text-[#e93483] uppercase flex items-center gap-2">
              <Flame className="size-4 text-orange-500" /> Hot right now
            </p>
            <h2 id="trending-heading" className="mt-2 text-heading text-ink">
              Trending <span className="gradient-text">Now</span>
            </h2>
          </div>
          <Link to="/trending" className="inline-flex items-center gap-1 text-meta font-bold text-primary transition hover:gap-2">
            See all <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
          {TRENDING.map(({ rank, name, category, searches, query }) => (
            <li key={rank} className="snap-start shrink-0 w-36 sm:w-auto">
              <Link to={`/search?q=${encodeURIComponent(query)}`} className="group glass-card card-lift block rounded-card p-4 text-center transition hover:border-primary/30">
                <div className={`mb-2 mx-auto size-10 rounded-full flex items-center justify-center text-lg font-black ${RANK_COLORS[rank] || 'text-ink-muted bg-surface-sunken'}`}>
                  {rank}
                </div>
                <p className="text-[13px] font-bold text-ink line-clamp-2 leading-snug">{name}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{category}</p>
                <p className="mt-2 text-[10px] text-primary font-semibold flex items-center justify-center gap-1">
                  <TrendingUp className="size-3" /> {searches} searches
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
