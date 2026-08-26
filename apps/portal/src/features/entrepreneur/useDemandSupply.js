import { useEffect, useState } from "react";
import { fetchDemandSupply } from "../../services/demandSupply.js";

/**
 * Fetches the Demand-Supply Gap analysis once and shares it between the
 * Demand & Supply Gap section and the Feasibility Assessment section --
 * both need the same demand/supply/competition data, and fetching it twice
 * would be a duplicate identical request for no benefit.
 */
export function useDemandSupply({ location, radiusKm, businessCategory, enabled = true }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    setState({ status: "loading" });

    fetchDemandSupply({
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
