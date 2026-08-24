import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER = [22.5905, 88.3635];

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        latitude: Math.round(event.latlng.lat * 1e6) / 1e6,
        longitude: Math.round(event.latlng.lng * 1e6) / 1e6,
      });
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onPick }) {
  const hasPoint = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const center = hasPoint ? [Number(latitude), Number(longitude)] : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-card border border-line">
      <MapContainer center={center} zoom={hasPoint ? 15 : 12} scrollWheelZoom className="h-64 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onPick} />
        {hasPoint ? (
          <CircleMarker
            center={[Number(latitude), Number(longitude)]}
            radius={9}
            pathOptions={{ color: "#0c6b4f", fillColor: "#0c6b4f", fillOpacity: 0.85 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
