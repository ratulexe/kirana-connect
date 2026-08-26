/**
 * PopulationProvider: the backend-only abstraction for estimating the
 * consumer population within a radius of a coordinate. Kept separate from
 * every other geographic provider (geocoding.service.js, overpass.service.js)
 * because population estimation has fundamentally different reliability
 * requirements -- a wrong shop location is merely inconvenient, a wrong
 * population figure directly misleads a real financing decision.
 *
 * Evaluated before writing this, not skipped:
 *   - Census of India: authoritative, but published as per-settlement
 *     tables (PDF/spreadsheet), not a live API that accepts a coordinate
 *     and radius. There is no official free endpoint this backend could
 *     call for "population within N km of (lat, lng)".
 *   - Gridded raster population datasets (WorldPop, GHSL, Meta's
 *     High-Resolution Population Density): the right long-term source for
 *     this, but require downloading and querying large raster files with a
 *     geospatial stack this project does not have -- there is no simple
 *     REST endpoint that returns a real radius sum without either a paid
 *     API or non-trivial new infrastructure.
 *   - OpenStreetMap administrative-boundary `population` tags (reachable
 *     through the Overpass integration this project already has): real
 *     and free, but the tag is optional, frequently absent or years stale
 *     for small Indian villages and blocks, and carries no guaranteed
 *     reference year. Presenting it as a population estimate would risk
 *     exactly the false precision this milestone was told to avoid.
 *
 * Conclusion: no source currently meets "reliable, free, India-covering,
 * radius-queryable, properly attributable, no fabricated interpolation"
 * all at once. Rather than wire up a fragile or misleading source, this
 * provider returns an explicit "unavailable" status -- the architecture
 * below is what a real provider would plug into once one exists.
 */
// eslint-disable-next-line no-unused-vars
export async function estimateConsumerPopulation({ lat, lng, radiusKm }) {
  return {
    status: "unavailable",
    estimatedPopulation: null,
    source: null,
    referenceYear: null,
    methodology: null,
  };
}
