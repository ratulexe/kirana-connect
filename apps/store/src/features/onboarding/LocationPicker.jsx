import { useEffect, useId, useRef, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
import { api, ApiError } from "../../lib/api.js";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon resolves its own image URLs, which a bundler
// rewrites and breaks. A small inline divIcon sidesteps the asset problem
// entirely and matches the brand colour.
const markerIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#0c6b4f;border:3px solid #ffffff;box-shadow:0 1px 4px rgba(22,24,28,.45)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Only used before the owner picks a point.
const FALLBACK_CENTER = { lat: 22.5726, lng: 88.3639 };

// Beyond this, a browser fix is too coarse to place a shop front.
const COARSE_ACCURACY_M = 500;

const round6 = (value) => Math.round(value * 1e6) / 1e6;

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(round6(event.latlng.lat), round6(event.latlng.lng));
    },
  });
  return null;
}

/**
 * Recentres when the position changes, choosing a zoom that matches how much
 * we actually know. Zooming to street level on a 5 km estimate would imply a
 * precision the fix does not have.
 */
function Recenter({ position, accuracy }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    if (!position) return;
    const key = `${position.lat},${position.lng},${accuracy ?? ""}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (accuracy && accuracy > COARSE_ACCURACY_M) {
      map.fitBounds(L.latLng(position.lat, position.lng).toBounds(accuracy * 2));
    } else {
      map.setView(position, Math.max(map.getZoom(), 17));
    }
  }, [map, position, accuracy]);

  return null;
}

function describeAccuracy(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Store location picker.
 *
 * Three ways to set the pin, because no single one is reliable:
 *   - the browser's own location, which on a desktop has no GPS and is
 *     estimated from IP and nearby WiFi, so it can be kilometres out,
 *   - tapping or dragging on the map,
 *   - typing coordinates directly, which also gives keyboard and screen
 *     reader users a route that does not depend on the map at all.
 *
 * When the browser fix is coarse we say so and show the uncertainty as a
 * circle, rather than dropping a confident-looking pin on a guess.
 */
export default function LocationPicker({ latitude, longitude, addressQuery, onChange, error }) {
  const latId = useId();
  const lngId = useId();

  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  const position = hasPosition ? { lat: latitude, lng: longitude } : null;

  const [geoState, setGeoState] = useState("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      setGeoMessage("This browser cannot share your location. Place the pin on the map instead.");
      return;
    }

    setGeoState("locating");
    setGeoMessage("");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setGeoState("located");
        setAccuracy(result.coords.accuracy ?? null);
        onChange(round6(result.coords.latitude), round6(result.coords.longitude));
      },
      (geoError) => {
        setGeoState("error");
        setAccuracy(null);
        setGeoMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was declined. Place the pin on the map instead."
            : "Your location could not be determined. Place the pin on the map instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const findFromAddress = async () => {
    if (!addressQuery) {
      setLookupState("error");
      setLookupMessage("Enter the store address first.");
      return;
    }

    setLookupState("locating");
    setLookupMessage("");

    try {
      const result = await api.geocodeStoreAddress({ q: addressQuery });
      if (!result) {
        setLookupState("error");
        setLookupMessage("No matching location was found. Place the pin on the map instead.");
        return;
      }

      setLookupState("located");
      setAccuracy(null);
      setLookupMessage(result.label ? `Matched ${result.label}` : "Matched the address.");
      onChange(result.lat, result.lng);
    } catch (lookupError) {
      setLookupState("error");
      setLookupMessage(
        lookupError instanceof ApiError
          ? lookupError.message
          : "The address could not be looked up. Place the pin on the map instead.",
      );
    }
  };

  // A manual edit supersedes whatever the browser guessed.
  const handleManual = (field, raw) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setAccuracy(null);
    if (field === "lat") onChange(round6(value), hasPosition ? longitude : 0);
    else onChange(hasPosition ? latitude : 0, round6(value));
  };

  const isCoarse = accuracy !== null && accuracy > COARSE_ACCURACY_M;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={findFromAddress}
            isLoading={lookupState === "locating"}
          >
            <MapPin className="size-4" aria-hidden="true" />
            {lookupState === "locating" ? "Finding address..." : "Find from address"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={useCurrentLocation}
            isLoading={geoState === "locating"}
          >
            <LocateFixed className="size-4" aria-hidden="true" />
            {geoState === "locating" ? "Finding you..." : "Use my current location"}
          </Button>
        </div>

        <p className="text-meta text-ink-muted" aria-live="polite">
          {hasPosition ? (
            <>
              Pin at{" "}
              <span className="font-semibold text-ink tabular-nums">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
              {accuracy !== null ? ` (within ${describeAccuracy(accuracy)})` : null}
            </>
          ) : (
            "No location set yet"
          )}
        </p>
      </div>

      {geoState === "error" ? <Alert tone="warning">{geoMessage}</Alert> : null}
      {lookupMessage ? (
        <Alert tone={lookupState === "error" ? "warning" : "info"}>{lookupMessage}</Alert>
      ) : null}

      {isCoarse ? (
        <Alert tone="warning" title="That location is only approximate">
          Your browser placed you within about {describeAccuracy(accuracy)}. Desktop
          computers have no GPS, so the position is estimated from your internet
          connection. Drag the pin onto your shop, or type the exact coordinates below.
        </Alert>
      ) : null}

      <div
        className="h-64 overflow-hidden rounded-card border border-line sm:h-72"
        // The map is a supplementary control. The authoritative values are the
        // coordinate fields below, which is why the map itself is hidden from
        // assistive tech rather than exposed as an unusable widget.
        aria-hidden="true"
      >
        <MapContainer
          center={position ?? FALLBACK_CENTER}
          zoom={position ? 16 : 11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <Recenter position={position} accuracy={accuracy} />

          {position && isCoarse ? (
            <Circle
              center={position}
              radius={accuracy}
              pathOptions={{ color: "#925708", fillColor: "#e0a018", fillOpacity: 0.12, weight: 1 }}
            />
          ) : null}

          {position ? (
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const { lat, lng } = event.target.getLatLng();
                  setAccuracy(null);
                  onChange(round6(lat), round6(lng));
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <p className="text-meta text-ink-muted">
        Tap the map to place your store, or drag the pin to fine-tune it. This decides
        which nearby customers can find you, so it is worth getting right.
      </p>

      {/* Typed entry: accessible without the map, and the reliable way to use
          coordinates copied from another maps app. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={latId} className="text-meta font-semibold text-ink-soft">
            Latitude
          </label>
          <input
            id={latId}
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            inputMode="decimal"
            value={hasPosition ? latitude : ""}
            onChange={(event) => handleManual("lat", event.target.value)}
            placeholder="22.810600"
            className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={lngId} className="text-meta font-semibold text-ink-soft">
            Longitude
          </label>
          <input
            id={lngId}
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            inputMode="decimal"
            value={hasPosition ? longitude : ""}
            onChange={(event) => handleManual("lng", event.target.value)}
            placeholder="88.230600"
            className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-meta font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
