import { create } from "zustand";

const STORAGE_KEY = "kc-location";
const ADDRESS_STORAGE_KEY = "kc-saved-addresses";
const PRECISE_CUSTOMER_ACCURACY_M = 1000;
const LOCATION_TIMEOUT_MS = 12000;

function clearStored() {
  localStorage.removeItem(STORAGE_KEY);
}

function persistLocation(location) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
}

function persistAddresses(addresses) {
  localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `addr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    source: "browser",
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

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readSavedAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((address) => Number.isFinite(Number(address?.lat)) && Number.isFinite(Number(address?.lng)))
      .map((address) => ({
        id: cleanText(address.id) || createId(),
        label: cleanText(address.label) || "Saved address",
        contactName: cleanText(address.contactName),
        phone: cleanText(address.phone),
        house: cleanText(address.house),
        area: cleanText(address.area),
        landmark: cleanText(address.landmark),
        note: cleanText(address.note),
        lat: Math.round(Number(address.lat) * 1e6) / 1e6,
        lng: Math.round(Number(address.lng) * 1e6) / 1e6,
        createdAt: address.createdAt || new Date().toISOString(),
        updatedAt: address.updatedAt || address.createdAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function addressLocation(address) {
  return {
    lat: address.lat,
    lng: address.lng,
    accuracy: null,
    source: "saved_address",
    addressId: address.id,
    addressLabel: address.label,
    addressLine: [address.house, address.area].filter(Boolean).join(", "),
  };
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
  savedAddresses: readSavedAddresses(),
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
    persistLocation(location);
    set({ location, status: "ready", error: "" });
  },

  selectAddress(id) {
    set((state) => {
      const address = state.savedAddresses.find((item) => item.id === id);
      if (!address) return { error: "That saved address is no longer available." };
      const location = addressLocation(address);
      persistLocation(location);
      return { location, status: "ready", error: "" };
    });
  },

  saveAddress(input) {
    const now = new Date().toISOString();
    const address = {
      id: input.id || createId(),
      label: cleanText(input.label) || "Saved address",
      contactName: cleanText(input.contactName),
      phone: cleanText(input.phone),
      house: cleanText(input.house),
      area: cleanText(input.area),
      landmark: cleanText(input.landmark),
      note: cleanText(input.note),
      lat: Math.round(Number(input.lat) * 1e6) / 1e6,
      lng: Math.round(Number(input.lng) * 1e6) / 1e6,
      createdAt: input.createdAt || now,
      updatedAt: now,
    };

    if (!Number.isFinite(address.lat) || !Number.isFinite(address.lng)) {
      set({ error: "Enter a valid latitude and longitude for this address." });
      return;
    }

    set((state) => {
      const addresses = state.savedAddresses.some((item) => item.id === address.id)
        ? state.savedAddresses.map((item) => (item.id === address.id ? address : item))
        : [address, ...state.savedAddresses].slice(0, 8);
      const location = addressLocation(address);

      persistAddresses(addresses);
      persistLocation(location);

      return { savedAddresses: addresses, location, status: "ready", error: "" };
    });
  },

  removeAddress(id) {
    set((state) => {
      const addresses = state.savedAddresses.filter((item) => item.id !== id);
      const activeRemoved = state.location?.addressId === id;
      persistAddresses(addresses);
      if (activeRemoved) clearStored();
      return {
        savedAddresses: addresses,
        location: activeRemoved ? null : state.location,
        status: activeRemoved ? "idle" : state.status,
        error: "",
      };
    });
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
      persistLocation(location);
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
