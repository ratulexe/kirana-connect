import { create } from "zustand";

const STORAGE_KEY = "kc-location";
const PRECISE_CUSTOMER_ACCURACY_M = 1000;
const LOCATION_TIMEOUT_MS = 12000;

function clearStored() {
  localStorage.removeItem(STORAGE_KEY);
}

function isUsable(position) {
  const accuracy = position.coords.accuracy;
  return !Number.isFinite(accuracy) || accuracy <= PRECISE_CUSTOMER_ACCURACY_M;
}

function toLocation(position) {
  return {
    lat: Math.round(position.coords.latitude * 1e6) / 1e6,
    lng: Math.round(position.coords.longitude * 1e6) / 1e6,
    accuracy: position.coords.accuracy ?? null,
  };
}

function describeAccuracy(accuracy) {
  if (!Number.isFinite(accuracy)) return "too approximate";
  return accuracy < 1000 ? `${Math.round(accuracy)} m` : `${(accuracy / 1000).toFixed(1)} km`;
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lng)) return null;
    return parsed;
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
    clearStored();
    set({ location: null, status: "idle", error: "" });
  },

  setLocation(location) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    set({ location, status: "ready", error: "" });
  },

  detect() {
    if (!navigator.geolocation) {
      clearStored();
      set({ location: null, status: "error", error: "This browser cannot share your location." });
      return;
    }

    set({ status: "locating", error: "" });

    let watchId = null;
    let timeoutId = null;
    let bestPosition = null;
    let settled = false;

    const finish = (next) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      set(next);
    };

    const savePosition = (position, message = "") => {
      const location = toLocation(position);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      finish({ location, status: "ready", error: message });
    };

    const saveApproximatePosition = (position) => {
      savePosition(
        position,
        `Using an approximate location (${describeAccuracy(
          position.coords.accuracy,
        )}). Nearby shops may be sorted less accurately on this device.`,
      );
    };

    const handlePosition = (position) => {
      if (
        !bestPosition ||
        (position.coords.accuracy ?? Number.POSITIVE_INFINITY) <
          (bestPosition.coords.accuracy ?? Number.POSITIVE_INFINITY)
      ) {
        bestPosition = position;
      }

      if (isUsable(position)) savePosition(position);
    };

    const handleError = (error) => {
      clearStored();
      finish({
        location: null,
        status: "error",
        error:
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined. Results are shown without distances."
            : "Your location could not be found. Results are shown without distances.",
      });
    };

    const options = { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isUsable(position)) {
          savePosition(position);
          return;
        }

        bestPosition = position;
      },
      handleError,
      options,
    );

    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, options);

    timeoutId = window.setTimeout(() => {
      if (bestPosition) {
        saveApproximatePosition(bestPosition);
        return;
      }

      clearStored();
      finish({
        location: null,
        status: "error",
        error: "Your location could not be found. Results are shown without distances.",
      });
    }, LOCATION_TIMEOUT_MS + 500);
  },
}));
