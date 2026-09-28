import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const placeIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

function MapCenter({ places }) {
  const map = useMap();

  useEffect(() => {
    if (places.length === 0) return;

    const validPlaces = places.filter(
      (p) => p.latitude != null && p.longitude != null
    );

    if (validPlaces.length === 0) return;

    const bounds = validPlaces.map((p) => [
      Number(p.latitude),
      Number(p.longitude),
    ]);

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [places, map]);

  return null;
}

export default function MapPlacePicker({
  places,
  fromPlaceId,
  toPlaceId,
  onFromChange,
  onToChange,
}) {
  const [selecting, setSelecting] = useState("from");

  const validPlaces = places.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  const handlePlaceClick = (place) => {
    if (selecting === "from") {
      onFromChange(String(place.place_id));

      // After selecting From, automatically switch to To
      setSelecting("to");
    } else {
      onToChange(String(place.place_id));
    }
  };

  if (validPlaces.length === 0) {
    return (
      <div className="card">
        <p className="msg-error">
          No places with map coordinates are available.
        </p>
        <p className="card-meta">
          Add latitude and longitude to your places before using the map.
        </p>
      </div>
    );
  }

  const firstPlace = validPlaces[0];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.7rem",
          marginBottom: "0.8rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className={selecting === "from" ? "btn" : "btn-secondary"}
          onClick={() => setSelecting("from")}
        >
          {fromPlaceId
            ? `From: ${
                places.find(
                  (p) => String(p.place_id) === String(fromPlaceId)
                )?.place_name || "Selected"
              }`
            : "Select From"}
        </button>

        <button
          type="button"
          className={selecting === "to" ? "btn" : "btn-secondary"}
          onClick={() => setSelecting("to")}
        >
          {toPlaceId
            ? `To: ${
                places.find(
                  (p) => String(p.place_id) === String(toPlaceId)
                )?.place_name || "Selected"
              }`
            : "Select To"}
        </button>
      </div>

      <p className="card-meta" style={{ marginBottom: "0.7rem" }}>
        {selecting === "from"
          ? "Click a place marker on the map to select your starting point."
          : "Click a place marker on the map to select your destination."}
      </p>

      <MapContainer
        center={[
          Number(firstPlace.latitude),
          Number(firstPlace.longitude),
        ]}
        zoom={12}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: "10px",
          marginBottom: "1rem",
        }}
      >
        <MapCenter places={validPlaces} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {validPlaces.map((place) => {
          const isFrom =
            String(place.place_id) === String(fromPlaceId);

          const isTo =
            String(place.place_id) === String(toPlaceId);

          return (
            <Marker
              key={place.place_id}
              position={[
                Number(place.latitude),
                Number(place.longitude),
              ]}
              icon={placeIcon}
              eventHandlers={{
                click: () => handlePlaceClick(place),
              }}
            >
              <Popup>
                <strong>{place.place_name}</strong>

                <br />

                {isFrom && "📍 Selected as From"}

                {isTo && "📍 Selected as To"}

                {!isFrom && !isTo && (
                  <button
                    type="button"
                    onClick={() => handlePlaceClick(place)}
                    style={{
                      marginTop: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Select this place
                  </button>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
