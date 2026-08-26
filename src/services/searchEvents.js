import { apiPost } from "../lib/api.js";

/**
 * Fire-and-forget analytics for one completed product search. Never throws
 * and is never meant to be awaited: a failed insert must not surface to the
 * customer or delay the results they already have on screen.
 */
export function recordConsumerSearchEvent(payload) {
  apiPost("/search-events", payload).catch((error) => {
    console.warn("[kirana-connect] could not record search event:", error?.message);
  });
}
