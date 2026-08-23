import { ChevronDown, LocateFixed, MapPin, X } from "lucide-react";
import { useState } from "react";
import { useLocationStore } from "../../store/locationStore.js";
import { cn } from "../../lib/cn.js";

/**
 * Sets the location distances are measured from.
 *
 * Location is offered, never demanded: without it every screen still works,
 * simply without distances, and that is stated rather than implied by an empty
 * space where a distance would be.
 */
export default function LocationControl({ className }) {
  const { location, status, error, detect, clear } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);

  const label = location
    ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`
    : "Set location";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={location ? "Change your location" : "Set your location"}
        className="group inline-flex max-w-[11rem] items-center gap-1.5 rounded-control px-2 py-2 text-left transition-colors duration-150 ease-brand hover:bg-surface-sunken"
      >
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-[0.6875rem] leading-none text-ink-muted">Shops near</span>
          <span className="mt-0.5 block truncate text-meta font-semibold text-ink tabular-nums">
            {label}
          </span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-card border border-line bg-surface p-4 shadow-float">
          <div className="flex items-start justify-between gap-3">
            <p className="text-card text-ink">Your location</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close location panel"
              className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1.5 text-meta text-ink-muted">
            Used only to sort shops by how far away they are. Nothing is sent anywhere
            except to find nearby stores.
          </p>

          {location ? (
            <p className="mt-3 rounded-control bg-surface-sunken px-3 py-2 text-meta text-ink-soft tabular-nums">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              {location.accuracy ? (
                <span className="block text-ink-muted">
                  accurate to about{" "}
                  {location.accuracy < 1000
                    ? `${Math.round(location.accuracy)} m`
                    : `${(location.accuracy / 1000).toFixed(1)} km`}
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
        </div>
      ) : null}
    </div>
  );
}
