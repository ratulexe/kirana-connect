import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
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

// Central Mumbai, only used before the owner picks a point.
const FALLBACK_CENTER = { lat: 19.076, lng: 72.8777 };

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  const lastKey = useRef("");

  useEffect(() => {
    if (!position) return;
    const key = `${position.lat},${position.lng}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.setView(position, Math.max(map.getZoom(), 16));
  }, [map, position]);

  return null;
}

/**
 * Store location picker.
 *
 * Geolocation is offered but never required: permission can be denied for good
 * reasons, and the owner can always drop the pin by hand. The coordinates are
 * also shown as text next to the map, so the value is available to anyone who
 * cannot use a drag-and-click interface.
 */
export default function LocationPicker({ latitude, longitude, onChange, error }) {
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  const position = hasPosition ? { lat: latitude, lng: longitude } : null;

  const [geoState, setGeoState] = useState("idle");
  const [geoMessage, setGeoMessage] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      setGeoMessage("This browser cannot share your location. Pick the spot on the map instead.");
      return;
    }

    setGeoState("locating");
    setGeoMessage("");

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setGeoState("idle");
        onChange(
          Math.round(result.coords.latitude * 1e6) / 1e6,
          Math.round(result.coords.longitude * 1e6) / 1e6,
        );
      },
      (geoError) => {
        setGeoState("error");
        setGeoMessage(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was declined. Tap the map to place your store instead."
            : "Your location could not be determined. Tap the map to place your store instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={useCurrentLocation}
          isLoading={geoState === "locating"}
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {geoState === "locating" ? "Finding you..." : "Use my current location"}
        </Button>

        <p className="text-meta text-ink-muted" aria-live="polite">
          {hasPosition ? (
            <>
              Pin at{" "}
              <span className="font-semibold text-ink tabular-nums">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </>
          ) : (
            "No location set yet"
          )}
        </p>
      </div>

      {geoState === "error" ? <Alert tone="warning">{geoMessage}</Alert> : null}

      <div
        className="h-64 overflow-hidden rounded-card border border-line sm:h-72"
        // The map is a supplementary control: the authoritative value is the
        // coordinate text above, which is why the map itself is hidden from
        // assistive tech rather than exposed as an unusable widget.
        aria-hidden="true"
      >
        <MapContainer
          center={position ?? FALLBACK_CENTER}
          zoom={position ? 16 : 12}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <Recenter position={position} />
          {position ? (
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const { lat, lng } = event.target.getLatLng();
                  onChange(Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6);
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <p className="text-meta text-ink-muted">
        Tap the map to place your store, or drag the pin to fine-tune it. This is what
        decides which nearby customers can find you.
      </p>

      {error ? (
        <p role="alert" className="text-meta font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
