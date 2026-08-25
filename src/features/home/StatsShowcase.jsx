import Container from '../../components/common/Container.jsx';
import AnimatedCounter from '../../components/common/AnimatedCounter.jsx';
import { useRevealOnScroll } from '../../animations/useRevealOnScroll.js';
import { usePlatformStats } from '../../hooks/useDiscovery.js';
import { Layers, MapPin, Package, ShoppingBag } from 'lucide-react';

export default function StatsShowcase() {
  const sectionRef = useRevealOnScroll();
  const { data: stats } = usePlatformStats();

  const STATS = [
    { icon: MapPin, value: stats?.stores ?? 0, suffix: '+', label: 'Kirana Stores', sublabel: 'Listed and growing', color: 'text-[#ffd45e]', glow: 'neon-glow-yellow' },
    { icon: Package, value: stats?.products ?? 0, suffix: '+', label: 'Products', sublabel: 'Across all categories', color: 'text-[#06b6d4]', glow: 'neon-glow-cyan' },
    { icon: Layers, value: stats?.categories ?? 0, suffix: '', label: 'Categories', sublabel: 'Everyday essentials, organised', color: 'text-[#e93483]', glow: 'neon-glow-pink' },
    { icon: ShoppingBag, value: stats?.listings ?? 0, suffix: '+', label: 'Live listings', sublabel: 'Priced by real stores', color: 'text-[#22c55e]', glow: 'neon-glow-green' },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-16 sm:py-20" aria-label="Platform statistics">
      <div className="absolute inset-0 bg-gradient-to-br from-[#261775] via-[#351f96] to-[#4f36d9]" />
      <div aria-hidden className="hero-grid absolute inset-0 opacity-20" />
      <div aria-hidden className="absolute -left-20 top-0 size-80 rounded-full bg-[#ff7b54]/20 blur-3xl" />
      <div aria-hidden className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#38bdf8]/20 blur-3xl" />
      <Container className="relative">
        <div className="text-center mb-12">
          <p className="text-meta font-bold uppercase tracking-widest text-[#ffd45e]">By the numbers</p>
          <h2 className="mt-2 text-heading text-white">Kirana Connect, <span className="gradient-text">live</span></h2>
        </div>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, suffix, label, sublabel, color, glow }) => (
            <div key={label} className={`glass-dark rounded-card p-6 text-center ${glow} card-lift`}>
              <Icon className={`mx-auto size-8 ${color} mb-4`} />
              <dt className="sr-only">{label}</dt>
              <dd className="text-4xl font-black text-white"><AnimatedCounter to={value} suffix={suffix} /></dd>
              <p className="mt-1 text-sm font-bold text-white">{label}</p>
              <p className="text-xs text-white/50 mt-0.5">{sublabel}</p>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
