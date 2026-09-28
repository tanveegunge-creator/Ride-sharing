import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const placeIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

function FitRoute({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route || route.length === 0) return;

    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [route, map]);

  return null;
}

export default function RouteMap({ sourcePlace, destinationPlace }) {
  const [route, setRoute] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sourceValid =
    sourcePlace?.latitude != null &&
    sourcePlace?.longitude != null;

  const destinationValid =
    destinationPlace?.latitude != null &&
    destinationPlace?.longitude != null;

  useEffect(() => {
    if (!sourceValid || !destinationValid) {
      setRoute([]);
      return;
    }

    const getRoute = async () => {
      setLoading(true);
      setError("");

      try {
        const sourceLon = Number(sourcePlace.longitude);
        const sourceLat = Number(sourcePlace.latitude);

        const destinationLon = Number(destinationPlace.longitude);
        const destinationLat = Number(destinationPlace.latitude);

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${sourceLon},${sourceLat};${destinationLon},${destinationLat}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Could not get route.");
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
          throw new Error("No road route found.");
        }

        const coordinates =
          data.routes[0].geometry.coordinates.map((point) => [
            point[1],
            point[0],
          ]);

        setRoute(coordinates);
      } catch (err) {
        console.error(err);
        setError("Could not load the road route.");
      } finally {
        setLoading(false);
      }
    };

    getRoute();
  }, [
    sourcePlace?.latitude,
    sourcePlace?.longitude,
    destinationPlace?.latitude,
    destinationPlace?.longitude,
    sourceValid,
    destinationValid,
  ]);

  if (!sourceValid || !destinationValid) {
    return null;
  }

  const center = [
    Number(sourcePlace.latitude),
    Number(sourcePlace.longitude),
  ];

  return (
    <div style={{ marginTop: "1rem" }}>
      {loading && (
        <p className="card-meta">
          Loading road route...
        </p>
      )}

      {error && (
        <p className="msg-error">
          {error}
        </p>
      )}

      <MapContainer
        center={center}
        zoom={12}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "10px",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker
          position={[
            Number(sourcePlace.latitude),
            Number(sourcePlace.longitude),
          ]}
          icon={placeIcon}
        >
          <Popup>
            <strong>From</strong>
            <br />
            {sourcePlace.place_name}
          </Popup>
        </Marker>

        <Marker
          position={[
            Number(destinationPlace.latitude),
            Number(destinationPlace.longitude),
          ]}
          icon={placeIcon}
        >
          <Popup>
            <strong>To</strong>
            <br />
            {destinationPlace.place_name}
          </Popup>
        </Marker>

        {route.length > 0 && (
          <>
            <Polyline
              positions={route}
              pathOptions={{
                weight: 5,
              }}
            />

            <FitRoute route={route} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
