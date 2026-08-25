import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kirana-wishlist";
const CHANGE_EVENT = "kirana-wishlist-change";

function readWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private browsing, quota); the in-memory
    // state still updates for this tab.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * The wishlist lives in localStorage, not the database -- there is no
 * account-level "save for later" table. This hook is the single source of
 * truth so every component reading or writing it (the heart button on a
 * product card, the wishlist page) stays in sync within the tab and across
 * tabs.
 */
export function useWishlist() {
  const [ids, setIds] = useState(readWishlist);

  useEffect(() => {
    const sync = () => setIds(readWishlist());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback((productId) => ids.includes(productId), [ids]);

  const toggle = useCallback((productId) => {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    writeWishlist(next);
    setIds(next);
  }, []);

  const remove = useCallback((productId) => {
    const next = readWishlist().filter((id) => id !== productId);
    writeWishlist(next);
    setIds(next);
  }, []);

  return { ids, isSaved, toggle, remove };
}
