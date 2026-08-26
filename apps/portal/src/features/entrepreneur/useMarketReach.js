import { useEffect, useState } from "react";
import { fetchMarketReach } from "../../services/marketReach.js";

/**
 * Fetches Market Reach once and shares it between the Market Reach section
 * and the SWOT engine, which needs the population-availability status for
 * its "no verified population estimate" weakness.
 */
export function useMarketReach({ location, radiusKm, businessCategory, enabled = true }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    setState({ status: "loading" });

    fetchMarketReach({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      categorySlug: businessCategory.slug,
      signal: controller.signal,
    })
      .then((data) => setState({ status: "loaded", data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ status: "error", message: error.message });
      });

    return () => controller.abort();
  }, [enabled, location.latitude, location.longitude, radiusKm, businessCategory.slug]);

  return state;
}
