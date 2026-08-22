import { MapPin, Sparkles } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import Badge from "../../components/common/Badge.jsx";
import StockBadge from "../../components/common/StockBadge.jsx";
import DiscountBadge from "../../components/common/DiscountBadge.jsx";
import PriceDisplay from "../../components/common/PriceDisplay.jsx";
import { formatDistance } from "../../utils/format.js";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

/**
 * Design specimen, not product data.
 *
 * Shop names are deliberately generic and the block is labelled as an example,
 * so nobody mistakes it for live results. It exists to prove the price, badge
 * and layout language holds together before the real comparison view is built
 * in the discovery milestone, at which point this section is replaced.
 */
const EXAMPLE_ROWS = [
  { shop: "Shop A", distanceKm: 0.4, price: 31.5, mrp: 33, discount: 4.55, stock: "in_stock" },
  { shop: "Shop B", distanceKm: 1.2, price: 32, mrp: 33, discount: 3.03, stock: "in_stock" },
  { shop: "Shop C", distanceKm: 2.8, price: 33, mrp: 33, discount: 0, stock: "low_stock" },
];

function ComparisonRow({ row, isCheapest }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-card text-ink">{row.shop}</p>
          {isCheapest ? (
            <Badge tone="primary" icon={Sparkles}>
              Lowest price
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 inline-flex items-center gap-1.5 text-meta text-ink-muted">
          <MapPin className="size-3.5" aria-hidden="true" />
          {formatDistance(row.distanceKm)} away
          <span aria-hidden="true">&middot;</span>
          <StockBadge status={row.stock} className="px-0 bg-transparent" />
        </p>
      </div>

      <div className="flex flex-col items-start gap-1.5 sm:items-end">
        <PriceDisplay price={row.price} mrp={row.mrp} size="sm" />
        <DiscountBadge percentage={row.discount} />
      </div>
    </li>
  );
}

export default function ComparisonPreview() {
  const sectionRef = useRevealOnScroll();
  const lowest = Math.min(...EXAMPLE_ROWS.map((row) => row.price));

  return (
    <section ref={sectionRef} aria-labelledby="comparison-heading">
      <Container className="pt-14 sm:pt-20">
        <SectionHeader
          id="comparison-heading"
          title="What a comparison looks like"
          description="Every nearby shop that has your item, priced side by side. Illustrative example."
        />

        <div className="mt-6 overflow-hidden rounded-panel border border-line bg-surface shadow-subtle">
          <div className="flex items-center justify-between gap-4 border-b border-line-soft bg-surface-sunken/60 px-5 py-3 sm:px-6">
            <p className="text-meta font-semibold text-ink-soft">3 shops within 3 km</p>
            <Badge tone="outline">Example</Badge>
          </div>

          <ul className="divide-y divide-line-soft">
            {EXAMPLE_ROWS.map((row) => (
              <ComparisonRow key={row.shop} row={row} isCheapest={row.price === lowest} />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
