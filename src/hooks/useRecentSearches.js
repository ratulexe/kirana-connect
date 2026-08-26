import { useCallback, useState } from "react";

const STORAGE_KEY = "kc.recentSearches";
const MAX_ENTRIES = 6;

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * The device's own actual search history, nothing more -- there is no
 * backend aggregation of what's "popular" (search_events is currently
 * write-only), so this is the one honest source of pre-type suggestions
 * available without inventing numbers.
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState(read);

  const addSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecent((current) => {
      const next = [trimmed, ...current.filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_ENTRIES,
      );
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private browsing, quota) -- the
        // in-memory state still works for the rest of this session.
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // See addSearch.
    }
  }, []);

  return { recent, addSearch, clear };
}
