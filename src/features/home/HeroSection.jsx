import {
  ArrowRight,
  IndianRupee,
  MapPinned,
  Navigation,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import Button from "../../components/common/Button.jsx";
import { useEntranceAnimation } from "../../animations/useEntranceAnimation.js";
import { usePlatformStats } from "../../hooks/useDiscovery.js";
import { useCategories } from "../../hooks/useCategories.js";
import { getCategoryIcon } from "../../utils/categoryIcons.js";

const PRODUCT_POINTS = [
  { icon: PackageSearch, label: "Compare nearby availability" },
  { icon: IndianRupee, label: "Check price store by store" },
  { icon: ShieldCheck, label: "Visit the shop with confidence" },
];

const STORE_POINTS = [
  { icon: MapPinned, label: "Local store discovery" },
  { icon: Tag, label: "Real participating store prices" },
  { icon: Navigation, label: "Easy go-to-store journey" },
];

function PointList({ points }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {points.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2.5 text-meta font-medium text-ink-soft">
          <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function HeroSection() {
  const heroRef = useEntranceAnimation();
  const { data: stats } = usePlatformStats();
  const { data: categories } = useCategories();

  // Real category photos already surfaced elsewhere on the home page
  // (CategoryStrip) -- reused here as the card's product visual rather than
  // any new or hotlinked image.
  const productChips = (categories ?? []).filter((category) => category.sample_image_url).slice(0, 3);
  const storeChips = (categories ?? []).slice(0, 4);

  return (
    <section className="relative isolate overflow-hidden bg-white text-ink border-b border-line">
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-[0.03]" />
      <Container className="relative py-14 sm:py-20 lg:py-24">
        <div ref={heroRef} className="mx-auto max-w-6xl text-center">
          <h1
            data-animate
            className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-sunken px-3 py-1.5 text-meta font-semibold text-primary"
          >
            <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
            Your neighbourhood, now searchable
          </h1>

          <div className="mt-8 grid gap-6 text-left lg:grid-cols-2 lg:gap-6">
            {/* Card 1 -- find products */}
            <article
              data-animate
              className="relative flex flex-col overflow-hidden rounded-panel border border-line bg-primary-soft p-6 shadow-float sm:p-8"
            >
              <h2 className="text-heading text-ink text-balance">Know where to buy.</h2>
              <p className="mt-3 text-body text-ink-soft">
                Search everyday items and instantly see which nearby kirana stores have them.
              </p>

              <PointList points={PRODUCT_POINTS} />

              <Button as={Link} to="/search" className="mt-6 self-start">
                Search nearby products
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>

              
            </article>

            {/* Card 2 -- compare stores */}
            <article
              data-animate
              className="relative flex flex-col overflow-hidden rounded-panel border border-line bg-accent-soft p-6 shadow-float sm:p-8"
            >
              <h2 className="text-heading text-ink text-balance">Compare before you go.</h2>
              <p className="mt-3 text-body text-ink-soft">
                See local prices, discover store options, and choose the best nearby match.
              </p>

              <PointList points={STORE_POINTS} />

              <Button as={Link} to="/stores" className="mt-6 self-start">
                Explore nearby stores
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>


            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
