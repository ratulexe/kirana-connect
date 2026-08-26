import { ArrowRight, BadgeIndianRupee, MapPinned, PackageCheck, ScanSearch } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import AnimatedCounter from "../../components/common/AnimatedCounter.jsx";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";
import { usePlatformStats } from "../../hooks/useDiscovery.js";

const FEATURES = [
  { icon: ScanSearch, title: "Search the shelf", body: "Look up the everyday things you need without guessing who might have them.", to: "/search?q=milk", label: "Start searching" },
  { icon: BadgeIndianRupee, title: "See shop-level prices", body: "Compare what nearby stores charge before stepping out the door.", to: "/search?q=atta", label: "Compare prices" },
  { icon: PackageCheck, title: "Find real availability", body: "Discover which local stores list the products they actually carry.", to: "/search?q=biscuits", label: "Find products" },
  { icon: MapPinned, title: "Keep it local", body: "Choose a neighbourhood shop, get there quickly and support the people around you.", to: "/search", label: "Explore nearby" },
];

const FEATURE_COLORS = [
  'from-[#ffcf57] to-[#fb6e72]',
  'from-[#533be0] to-[#bd64e5]',
  'from-[#10b981] to-[#34d399]',
  'from-[#e93483] to-[#ff825b]',
];

export default function WhyKirana() {
  const sectionRef = useRevealOnScroll();
  const { data: stats } = usePlatformStats();

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-14 sm:py-20" aria-labelledby="why-kirana-heading">
      <div aria-hidden="true" className="absolute -left-20 bottom-0 size-72 rounded-full bg-[#e93483]/8 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-20 top-0 size-72 rounded-full bg-[#eab14b]/10 blur-3xl" />
      <Container className="relative">
        <div className="max-w-2xl">
          <p className="text-meta font-bold tracking-[.14em] text-accent uppercase">Local shopping, upgraded</p>
          <h2 id="why-kirana-heading" className="mt-2 text-heading text-ink">All the speed of knowing. All the joy of local.</h2>
          <p className="mt-3 text-body text-ink-muted">Kirana Connect makes everyday shopping feel clear, colourful and close to home—without making promises that a local store cannot keep.</p>

          <div className="mt-6 flex flex-wrap gap-8">
            <div><div className="text-3xl font-bold text-primary"><AnimatedCounter to={stats?.stores ?? 0} suffix="+" /></div><div className="text-sm text-ink-muted">Stores</div></div>
            <div><div className="text-3xl font-bold text-primary"><AnimatedCounter to={stats?.products ?? 0} suffix="+" /></div><div className="text-sm text-ink-muted">Products</div></div>
            <div><div className="text-3xl font-bold text-primary"><AnimatedCounter to={stats?.listings ?? 0} suffix="+" /></div><div className="text-sm text-ink-muted">Live listings</div></div>
          </div>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body, to, label }, index) => (
            <li key={title}>
              <Link to={to} className="card-lift group block h-full rounded-card border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
                <span className={`inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${FEATURE_COLORS[index]} text-white transition duration-300 group-hover:rotate-6 group-hover:scale-110`}><Icon className="size-5" /></span>
                <h3 className="mt-5 text-card text-ink">{title}</h3>
                <p className="mt-1.5 text-meta text-ink-muted">{body}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-meta font-bold text-primary group-hover:gap-2">{label}<ArrowRight className="size-3.5" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
