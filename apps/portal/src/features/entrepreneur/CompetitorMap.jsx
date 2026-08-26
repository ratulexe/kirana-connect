import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPinned, Store } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon resolves its own image URLs, which the
// bundler rewrites and breaks -- the same reason the Store app's own
// LocationPicker uses inline divIcons instead. Shape (square vs circle) is
// the primary distinguishing signal, color is secondary, so the difference
// still reads without relying on color alone.
const centerIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#16181c;border:3px solid #ffffff;box-shadow:0 1px 4px rgba(22,24,28,.5)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const kiranaConnectIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:4px;background:#0c6b4f;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(22,24,28,.45)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const externalIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#c07a1f;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(22,24,28,.45)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function CompetitorPopup({ competitor }) {
  const isKiranaConnect = competitor.source === "kirana-connect";

  return (
    <div className="min-w-40 text-meta">
      <p className="flex items-center gap-1.5 font-semibold text-ink">
        {isKiranaConnect ? (
          <Store className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <MapPinned className="size-3.5 shrink-0 text-[#c07a1f]" aria-hidden="true" />
        )}
        {competitor.name ?? "Unnamed mapped business"}
      </p>
      <p className="mt-1 text-ink-soft">{competitor.distanceKm.toFixed(2)} km away</p>
      {isKiranaConnect ? (
        <>
          <p className="mt-0.5 text-ink-soft">
            {competitor.competitionRelation === "primary" ? "Primary competitor" : "Overlapping competitor"}
          </p>
          <p className="mt-0.5 text-ink-muted">Kirana Connect store</p>
        </>
      ) : (
        <>
          <p className="mt-0.5 text-ink-soft">Mapped type: {competitor.externalType ?? "unspecified"}</p>
          <p className="mt-0.5 text-ink-muted">OpenStreetMap listing</p>
        </>
      )}
    </div>
  );
}

// react-leaflet's MapContainer only reads center/zoom once, at creation --
// it never re-centers or re-zooms itself when those props change on a later
// render. The analysis page keeps this component mounted across an entire
// session (see EntrepreneurAnalysis.jsx), so switching location, category or
// radius (e.g. via Edit details) left the map frozen on whichever place and
// zoom it first loaded, while the competitor list below it correctly
// updated -- a real, visible mismatch, not a cosmetic issue.
//
// Fitting to the search-radius circle (rather than a hardcoded zoom) also
// fixes a related confusion: at a fixed zoom, a 10 km analysis shows several
// times more real-world area than a 5 km one, so the map's own edges can
// land on an unrelated town well outside the search radius. Fitting the
// zoom to the actual circle keeps what's visible tied to what's relevant.
function RecenterOnChange({ center, radiusKm }) {
  const map = useMap();
  const [lat, lng] = center;

  useEffect(() => {
    // fitBounds's zoom choice depends on the container's CURRENT pixel size
    // (map.getSize()). Every tab panel stays mounted permanently (see
    // EntrepreneurAnalysis.jsx), and analysis always lands on Overview
    // first, so this can run while the Market panel is still `display:
    // none` -- a 0x0 container makes fitBounds pick a nonsensical zoom
    // (verified live: the circle rendered 3x taller than its own
    // container). EntrepreneurAnalysis.jsx already dispatches a window
    // "resize" event the moment the Market tab becomes visible, for
    // exactly this class of problem -- reusing that same signal here
    // re-runs the fit once the container has a real size, without adding
    // another prop just for this.
    const recenter = () => {
      // L.circle(...).getBounds() requires the circle to already be
      // attached to a map (it crashes otherwise -- verified live).
      // LatLng.toBounds() is the map-independent equivalent -- but its
      // argument is the full box WIDTH, each edge landing sizeInMeters/2
      // from the centre (per Leaflet's own doc comment), not a radius.
      // Passing the radius directly here first produced a box half the
      // size of the actual search-radius circle, which still overflowed
      // the container after fitting to it (verified live: a 567px-radius
      // circle inside a 382px-tall map). Doubling it makes each edge land
      // exactly radiusKm away, matching the circle actually drawn below.
      const bounds = L.latLng(lat, lng).toBounds(radiusKm * 1000 * 2);
      map.invalidateSize();
      // animate: false -- an animated pan/zoom here has no user intent
      // behind it (nobody asked the map to move), so it reads as the map
      // glitching rather than a considered transition. Settling instantly
      // also keeps this deterministic to test: an in-flight zoom animation
      // means whatever's read right after this call depends on how far the
      // animation has gotten, not the final state.
      map.fitBounds(bounds, { padding: [24, 24], animate: false });
    };

    recenter();
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, [map, lat, lng, radiusKm]);

  return null;
}

export default function CompetitorMap({ center, radiusKm, competitors }) {
  return (
    <div
      className="h-80 overflow-hidden rounded-card border border-line sm:h-96"
      role="group"
      aria-label={`Map of ${competitors.length} mapped competitors within ${radiusKm} km of the analysis location. The list below gives the same information as text.`}
    >
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <RecenterOnChange center={center} radiusKm={radiusKm} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#0c6b4f", fillColor: "#0c6b4f", fillOpacity: 0.06, weight: 1.5 }}
        />

        <Marker position={center} icon={centerIcon}>
          <Popup>
            <p className="text-meta font-semibold text-ink">Analysis center</p>
          </Popup>
        </Marker>

        {competitors.map((competitor) => (
          <Marker
            key={competitor.id}
            position={[competitor.latitude, competitor.longitude]}
            icon={competitor.source === "kirana-connect" ? kiranaConnectIcon : externalIcon}
          >
            <Popup>
              <CompetitorPopup competitor={competitor} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
