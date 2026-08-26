import Container from '../../components/common/Container.jsx';
import AnimatedCounter from '../../components/common/AnimatedCounter.jsx';
import { useRevealOnScroll } from '../../animations/useRevealOnScroll.js';
import { usePlatformStats } from '../../hooks/useDiscovery.js';
import { Layers, MapPin, Package, ShoppingBag } from 'lucide-react';

export default function StatsShowcase() {
  const sectionRef = useRevealOnScroll();
  const { data: stats } = usePlatformStats();

  const STATS = [
    { icon: MapPin, value: stats?.stores ?? 0, suffix: '+', label: 'Kirana Stores', sublabel: 'Listed and growing', style: 'from-amber-400 to-orange-500' },
    { icon: Package, value: stats?.products ?? 0, suffix: '+', label: 'Products', sublabel: 'Across all categories', style: 'from-cyan-400 to-sky-500' },
    { icon: Layers, value: stats?.categories ?? 0, suffix: '', label: 'Categories', sublabel: 'Everyday essentials, organised', style: 'from-pink-400 to-rose-500' },
    { icon: ShoppingBag, value: stats?.listings ?? 0, suffix: '+', label: 'Live listings', sublabel: 'Priced by real stores', style: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-16 sm:py-20" aria-label="Platform statistics">
      <Container className="relative">
        <div className="text-center mb-12">
          <p className="text-meta font-bold uppercase tracking-widest text-primary">By the numbers</p>
          <h2 className="mt-2 text-heading text-ink">Kirana Connect, <span className="text-primary">live</span></h2>
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, suffix, label, sublabel, style }) => (
            <div key={label} className="card-lift rounded-card border border-line bg-surface p-6 text-center shadow-subtle">
              <span className={`mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${style} text-white`}>
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <dt className="sr-only">{label}</dt>
              <dd className="text-4xl font-black text-ink"><AnimatedCounter to={value} suffix={suffix} /></dd>
              <p className="mt-1 text-sm font-bold text-ink">{label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{sublabel}</p>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
