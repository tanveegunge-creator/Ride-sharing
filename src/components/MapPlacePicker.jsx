import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect } from "react";

// Fixes invisible default markers when using Vite
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const PUNE_CENTER = [18.5204, 73.8567];

function FitToPlaces({ places }) {
  const map = useMap();
  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [places, map]);
  return null;
}

/**
 * Props:
 *  places:  array from GET /places/  ({ place_id, place_name, latitude, longitude })
 *  fromId:  currently selected source place_id (or null)
 *  toId:    currently selected destination place_id (or null)
 *  onChange({ fromId, toId }): called when the user clicks a marker
 *
 * Click logic: 1st click = From, 2nd click = To, 3rd click starts over.
 */
export default function MapPlacePicker({ places = [], fromId, toId, onChange }) {
  const withCoords = places.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  const handleClick = (place) => {
    if (fromId == null || (fromId != null && toId != null)) {
      onChange({ fromId: place.place_id, toId: null });
    } else if (place.place_id !== fromId) {
      onChange({ fromId, toId: place.place_id });
    }
  };

  const label = (p) =>
    p.place_id === fromId ? " (From)" : p.place_id === toId ? " (To)" : "";

  if (places.length > 0 && withCoords.length === 0) {
    return (
      <p style={{ color: "crimson" }}>
        Places have no coordinates yet. The API is not returning latitude and
        longitude.
      </p>
    );
  }

  return (
    <div>
      <p style={{ margin: "0 0 8px" }}>
        {fromId == null
          ? "Click a marker to choose the starting place."
          : toId == null
          ? "Now click a marker to choose the destination."
          : "Click any marker to start a new selection."}
      </p>
      <MapContainer
        center={PUNE_CENTER}
        zoom={12}
        style={{ height: 400, width: "100%", borderRadius: 8 }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitToPlaces places={withCoords} />
        {withCoords.map((p) => (
          <Marker
            key={p.place_id}
            position={[p.latitude, p.longitude]}
            eventHandlers={{ click: () => handleClick(p) }}
          >
            <Popup>
              {p.place_name}
              {label(p)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
