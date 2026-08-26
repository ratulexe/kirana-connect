import {
  Briefcase,
  Check,
  ChevronDown,
  Home,
  LocateFixed,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocationStore } from "../../store/locationStore.js";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../auth/useAuth.js";
import { useCustomerAddresses } from "../../features/customer/useCustomer.js";

const EMPTY_FORM = {
  label: "Home",
  contactName: "",
  phone: "",
  house: "",
  area: "",
  landmark: "",
  note: "",
  lat: "",
  lng: "",
};

function addressIcon(label) {
  return label.toLowerCase().includes("work") ? Briefcase : Home;
}

function remoteAddressSummary(address) {
  return [
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.city,
    address.state,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
}

function remoteAddressLocation(address) {
  return {
    lat: Number(address.latitude),
    lng: Number(address.longitude),
    accuracy: null,
    source: "saved",
    addressId: address.id,
    addressLabel: address.label,
    addressLine: remoteAddressSummary(address),
  };
}

function formFromAddress(address, location) {
  if (address) {
    return {
      ...address,
      lat: String(address.lat),
      lng: String(address.lng),
    };
  }

  return {
    ...EMPTY_FORM,
    lat: location?.lat ? String(location.lat) : "",
    lng: location?.lng ? String(location.lng) : "",
  };
}

function accuracyLabel(accuracy) {
  if (!Number.isFinite(accuracy)) return "";
  return accuracy < 1000 ? `${Math.round(accuracy)} m` : `${(accuracy / 1000).toFixed(1)} km`;
}

function SavedAddressForm({ initialValues, currentLocation, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => formFromAddress(initialValues, currentLocation));
  const [error, setError] = useState("");

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const useCurrentPin = () => {
    if (!currentLocation) {
      setError("Use your current location first, then save it as an address.");
      return;
    }
    setValues((current) => ({
      ...current,
      lat: String(currentLocation.lat),
      lng: String(currentLocation.lng),
    }));
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    const lat = Number(values.lat);
    const lng = Number(values.lng);

    if (!values.label.trim()) {
      setError("Give this address a label.");
      return;
    }
    if (!values.contactName.trim()) {
      setError("Add the receiver name.");
      return;
    }
    if (!values.phone.trim()) {
      setError("Add a phone number.");
      return;
    }
    if (!values.house.trim() || !values.area.trim()) {
      setError("Add house/flat and area details.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Add a valid latitude and longitude.");
      return;
    }

    onSubmit({ ...values, lat, lng });
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-card border border-line bg-canvas p-3">
      <div className="grid gap-3">
        <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
          Label
          <select
            value={values.label}
            onChange={update("label")}
            className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta font-semibold text-ink"
          >
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>
        </label>

        <div className="grid gap-3">
          <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
            Receiver name
            <input
              value={values.contactName}
              onChange={update("contactName")}
              className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
              placeholder="Enter Receiver Name"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
            Phone
            <input
              value={values.phone}
              onChange={update("phone")}
              className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
              placeholder="Enter Recevier's number"
              inputMode="tel"
            />
          </label>
        </div>

        <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
          House / flat / floor
          <input
            value={values.house}
            onChange={update("house")}
            className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
            placeholder="Enter House/Flat/Floor No."
          />
        </label>

        <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
          Area / street
          <input
            value={values.area}
            onChange={update("area")}
            className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
            placeholder="Enter Area/Locality"
          />
        </label>

        <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
          Nearby landmark
          <input
            value={values.landmark}
            onChange={update("landmark")}
            className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
            placeholder="Enter a landmark"
          />
        </label>

        <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
          Delivery note
          <input
            value={values.note}
            onChange={update("note")}
            className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink"
            placeholder="Call before arriving"
          />
        </label>

        <div className="grid gap-3">
          <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
            Latitude
            <input
              value={values.lat}
              onChange={update("lat")}
              className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink tabular-nums"
              placeholder="22.590500"
              inputMode="decimal"
            />
          </label>
          <label className="grid min-w-0 gap-1 text-meta font-semibold text-ink-soft">
            Longitude
            <input
              value={values.lng}
              onChange={update("lng")}
              className="h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-meta text-ink tabular-nums"
              placeholder="88.363500"
              inputMode="decimal"
            />
          </label>
          <button
            type="button"
            onClick={useCurrentPin}
            className="justify-self-start rounded-control px-3 py-2 text-meta font-semibold text-primary hover:bg-primary-soft"
          >
            Use pin
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-meta font-medium text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center justify-center rounded-control px-3 text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-control bg-primary px-3.5 text-meta font-semibold text-primary-fg hover:bg-primary-hover"
        >
          <Check className="size-3.5" aria-hidden="true" />
          Save address
        </button>
      </div>
    </form>
  );
}

/**
 * Sets the location distances are measured from.
 *
 * Location is offered, never demanded: without it every screen still works,
 * simply without distances, and that is stated rather than implied by an empty
 * space where a distance would be.
 */
export default function LocationControl({ className, compact = false }) {
  const auth = useAuth();
  const remoteAddresses = useCustomerAddresses();
  const {
    location,
    savedAddresses,
    status,
    error,
    detect,
    clear,
    saveAddress,
    removeAddress,
    selectAddress,
  } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const signedIn = auth.isAuthenticated;

  const label = location?.addressLabel
    ? location.addressLabel
    : location
      ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
      : "Set location";

  const addressRows = useMemo(
    () => (signedIn ? remoteAddresses.data ?? [] : savedAddresses),
    [remoteAddresses.data, savedAddresses, signedIn],
  );
  const sortedAddresses = useMemo(
    () =>
      [...addressRows].sort((first, second) => {
        if (first.id === location?.addressId) return -1;
        if (second.id === location?.addressId) return 1;
        if (signedIn && first.is_default !== second.is_default) return first.is_default ? -1 : 1;
        return first.label.localeCompare(second.label);
      }),
    [addressRows, location?.addressId, signedIn],
  );

  const startNewAddress = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleSaveAddress = (values) => {
    saveAddress(values);
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleUseSavedAddress = (address) => {
    if (signedIn) {
      useLocationStore.getState().setLocation(remoteAddressLocation(address));
    } else {
      selectAddress(address.id);
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={location ? "Change your location" : "Set your location"}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-control text-left transition-colors duration-150 ease-brand hover:bg-surface-sunken",
          compact ? "size-9 justify-center" : "max-w-[12rem] px-2 py-2",
        )}
      >
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {!compact ? (
          <span className="min-w-0">
            <span className="block text-[0.6875rem] leading-none text-ink-muted">Shops near</span>
            <span className="mt-0.5 block truncate text-meta font-semibold text-ink">
              {label}
            </span>
          </span>
        ) : null}
        {!compact ? (
          <ChevronDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={cn(
            "z-[60] max-h-[80dvh] overflow-y-auto overflow-x-hidden rounded-card border border-line bg-surface p-4 shadow-float",
            compact
              ? "fixed top-16 right-3 left-3"
              : "absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-card text-ink">Delivery address</p>
              <p className="mt-1 text-meta text-ink-muted">
                Save home, work, or any regular drop-off point.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close location panel"
              className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {location ? (
            <p className="mt-3 rounded-control bg-surface-sunken px-3 py-2 text-meta text-ink-soft">
              <span className="font-semibold text-ink">
                {location.addressLabel ?? "Current location"}
              </span>
              <span className="mt-0.5 block tabular-nums">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
              {location.accuracy ? (
                <span className="block text-ink-muted">
                  accurate to about {accuracyLabel(location.accuracy)}
                </span>
              ) : null}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 text-meta text-warning">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={detect}
              disabled={status === "locating"}
              className="inline-flex h-9 items-center gap-1.5 rounded-control bg-primary px-3.5 text-meta font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-45"
            >
              <LocateFixed className="size-3.5" aria-hidden="true" />
              {status === "locating" ? "Finding you..." : "Use my location"}
            </button>

            {signedIn ? (
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-meta font-semibold text-ink hover:border-primary/40 hover:bg-primary-soft"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add address
              </Link>
            ) : (
              <button
                type="button"
                onClick={startNewAddress}
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-meta font-semibold text-ink hover:border-primary/40 hover:bg-primary-soft"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add address
              </button>
            )}

            {location ? (
              <button
                type="button"
                onClick={clear}
                className="inline-flex h-9 items-center rounded-control px-3 text-meta font-semibold text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Clear
              </button>
            ) : null}
          </div>

          {signedIn && remoteAddresses.isError ? (
            <p role="alert" className="mt-3 text-meta text-danger">
              Could not load saved addresses. You can still use current location.
            </p>
          ) : null}

          {signedIn && remoteAddresses.isPending ? (
            <p className="mt-3 text-meta text-ink-muted">Loading saved addresses...</p>
          ) : null}

          {sortedAddresses.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sortedAddresses.map((address) => {
                const Icon = addressIcon(address.label);
                const isActive = location?.addressId === address.id;
                const line = signedIn
                  ? remoteAddressSummary(address)
                  : [address.house, address.area].filter(Boolean).join(", ");

                return (
                  <div
                    key={address.id}
                    className={cn(
                      "rounded-card border p-3 transition-colors",
                      isActive ? "border-primary bg-primary-soft" : "border-line bg-surface",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-meta font-bold text-ink">{address.label}</p>
                          {isActive ? (
                            <span className="rounded-pill bg-success-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-success">
                              Selected
                            </span>
                          ) : null}
                          {signedIn && address.is_default ? (
                            <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-fg">
                              Default
                            </span>
                          ) : null}
                        </div>
                        {!signedIn ? (
                          <p className="mt-1 text-meta text-ink-soft">
                            {address.contactName}
                            {address.phone ? `, ${address.phone}` : ""}
                          </p>
                        ) : null}
                        <p className="mt-1 text-meta text-ink-muted">
                          {line}
                        </p>
                        {!signedIn && address.landmark ? (
                          <p className="mt-1 text-meta text-ink-muted">
                            Landmark: {address.landmark}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleUseSavedAddress(address);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-meta font-semibold text-primary hover:bg-primary-soft"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        Use
                      </button>
                      {signedIn ? (
                        <Link
                          to="/account"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Manage
                        </Link>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddress(address);
                              setShowForm(true);
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-meta font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAddress(address.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-meta font-semibold text-danger hover:bg-danger-soft"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {showForm && !signedIn ? (
            <SavedAddressForm
              key={editingAddress?.id ?? "new-address"}
              initialValues={editingAddress}
              currentLocation={location}
              onCancel={() => {
                setShowForm(false);
                setEditingAddress(null);
              }}
              onSubmit={handleSaveAddress}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
