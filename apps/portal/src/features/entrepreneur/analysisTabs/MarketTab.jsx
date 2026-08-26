import MarketReach from "../MarketReach.jsx";
import CompetitorMapping from "../CompetitorMapping.jsx";
import DemandSupplyGap from "../DemandSupplyGap.jsx";
import LocalProductMarketValue from "../LocalProductMarketValue.jsx";

/**
 * Presentation restructuring only -- MarketReach, CompetitorMapping,
 * DemandSupplyGap and LocalProductMarketValue are unchanged components,
 * moved here from the single long page. Data comes from hooks that live in
 * EntrepreneurAnalysis.jsx (fetched once regardless of which tab is
 * active), passed straight through as props.
 */
export default function MarketTab({ location, radiusKm, businessCategory, marketReachState, demandSupplyState, priceIntelligenceState }) {
  return (
    <div className="py-8 sm:py-10">
      <h1 className="text-heading text-ink">Market</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-muted">
        Reach, competitors, demand and supply, and observed local prices for this location and category.
      </p>

      <section aria-labelledby="market-reach-heading" className="mt-8">
        <h2 id="market-reach-heading" className="text-section text-ink">
          Market Reach
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          The geographic area this analysis covers, and typical distribution channels for this business type.
        </p>
        <MarketReach state={marketReachState} />
      </section>

      <section aria-labelledby="competitor-mapping-heading" className="mt-10">
        <h2 id="competitor-mapping-heading" className="text-section text-ink">
          Competitor Mapping
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          Businesses identified near this location from Kirana Connect's own store data and publicly mapped
          OpenStreetMap listings.
        </p>
        <CompetitorMapping location={location} radiusKm={radiusKm} businessCategory={businessCategory} />
      </section>

      <section aria-labelledby="demand-supply-heading" className="mt-10">
        <h2 id="demand-supply-heading" className="text-section text-ink">
          Demand &amp; Supply Gap
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          What people nearby have been searching for, and how well current participating Kirana Connect supply
          is meeting it.
        </p>
        <DemandSupplyGap state={demandSupplyState} />
      </section>

      <section aria-labelledby="price-intelligence-heading" className="mt-10">
        <h2 id="price-intelligence-heading" className="text-section text-ink">
          Local Product Market Value
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          Real selling prices observed across participating Kirana Connect stores in the selected radius, per
          product size.
        </p>
        <LocalProductMarketValue state={priceIntelligenceState} />
      </section>
    </div>
  );
}
