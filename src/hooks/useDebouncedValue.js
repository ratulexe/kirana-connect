import { useEffect, useState } from "react";

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 * The single debounce point for search-as-you-type: the input itself stays
 * instantly responsive (it is never debounced), only the value fed onward
 * into the network request is delayed, and a fresh keystroke always resets
 * the timer rather than queuing up stale updates.
 */
export function useDebouncedValue(value, delayMs = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
