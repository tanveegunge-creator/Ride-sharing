import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [points, map]);
  return null;
}

// Straight-line distance in km between two [lat, lng] points
function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/**
 * Props:
 *  from: place object { place_name, latitude, longitude } or null
 *  to:   place object or null
 */
export default function RouteMap({ from, to }) {
  const hasCoords = (p) => p && p.latitude != null && p.longitude != null;
  const start = hasCoords(from) ? [from.latitude, from.longitude] : null;
  const end = hasCoords(to) ? [to.latitude, to.longitude] : null;
  const points = [start, end].filter(Boolean);

  return (
    <div>
      {start && end && (
        <p style={{ margin: "0 0 8px" }}>
          {from.place_name} to {to.place_name}: about{" "}
          {haversineKm(start, end).toFixed(1)} km in a straight line
        </p>
      )}
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={12}
        style={{ height: 350, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitBounds points={points} />
        {start && (
          <Marker position={start}>
            <Popup>From: {from.place_name}</Popup>
          </Marker>
        )}
        {end && (
          <Marker position={end}>
            <Popup>To: {to.place_name}</Popup>
          </Marker>
        )}
        {start && end && <Polyline positions={[start, end]} weight={4} />}
      </MapContainer>
    </div>
  );
}
