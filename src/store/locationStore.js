import { create } from "zustand";

const STORAGE_KEY = "kc-location";

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The customer's chosen location.
 *
 * This is the one piece of genuine global client state in the consumer app:
 * the header sets it, and search results, the product page and every distance
 * read it. It is not server data, so it does not belong in TanStack Query, and
 * threading it through props would touch every screen.
 *
 * Persisted so a returning visitor keeps their distances without being asked
 * for permission again.
 */
export const useLocationStore = create((set) => ({
  location: readStored(),
  status: "idle",
  error: "",

  // How far to look, and what "best" means. These travel with the location
  // because they are the same decision from the customer's point of view.
  radiusKm: 5,
  sort: "price",
  setRadius: (radiusKm) => set({ radiusKm }),
  setSort: (sort) => set({ sort }),

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    set({ location: null, status: "idle", error: "" });
  },

  setLocation(location) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    set({ location, status: "ready", error: "" });
  },

  detect() {
    if (!navigator.geolocation) {
      set({ status: "error", error: "This browser cannot share your location." });
      return;
    }

    set({ status: "locating", error: "" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
          accuracy: position.coords.accuracy ?? null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
        set({ location, status: "ready", error: "" });
      },
      (error) => {
        set({
          status: "error",
          error:
            error.code === error.PERMISSION_DENIED
              ? "Location permission was declined. Results are shown without distances."
              : "Your location could not be found. Results are shown without distances.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  },
}));
