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

import {
  useRideTracking,
} from "../hooks/useRideTracking";


const placeIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});


const driverIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});


function MapUpdater({
  location,
  sourcePlace,
}) {
  const map = useMap();

  if (location) {
    map.setView(
      [
        Number(location.latitude),
        Number(location.longitude),
      ],
      map.getZoom()
    );
  }

  return null;
}


export default function RideMap({
  rideId,
  sourcePlace,
  destinationPlace,
}) {
  const {
    location,
    locationHistory,
    connected,
  } = useRideTracking(rideId);

  const sourceHasCoords =
    sourcePlace?.latitude != null &&
    sourcePlace?.longitude != null;

  const destHasCoords =
    destinationPlace?.latitude != null &&
    destinationPlace?.longitude != null;

  if (
    !sourceHasCoords &&
    !destHasCoords &&
    !location
  ) {
    return (
      <p
        className="card-meta"
        style={{ marginTop: "0.6rem" }}
      >
        No map data available.
      </p>
    );
  }

  const center = location
    ? [
        Number(location.latitude),
        Number(location.longitude),
      ]
    : sourceHasCoords
    ? [
        Number(sourcePlace.latitude),
        Number(sourcePlace.longitude),
      ]
    : [
        Number(destinationPlace.latitude),
        Number(destinationPlace.longitude),
      ];

  return (
    <div style={{ marginTop: "0.8rem" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{
          height: "420px",
          width: "100%",
          borderRadius: 8,
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {sourceHasCoords && (
          <Marker
            position={[
              Number(sourcePlace.latitude),
              Number(sourcePlace.longitude),
            ]}
            icon={placeIcon}
          >
            <Popup>
              <strong>Pickup</strong>
              <br />
              {sourcePlace.place_name}
            </Popup>
          </Marker>
        )}

        {destHasCoords && (
          <Marker
            position={[
              Number(
                destinationPlace.latitude
              ),
              Number(
                destinationPlace.longitude
              ),
            ]}
            icon={placeIcon}
          >
            <Popup>
              <strong>Drop-off</strong>
              <br />
              {destinationPlace.place_name}
            </Popup>
          </Marker>
        )}

        {locationHistory.length > 1 && (
          <Polyline
            positions={locationHistory.map(
              (point) => [
                Number(point.latitude),
                Number(point.longitude),
              ]
            )}
            pathOptions={{
              weight: 5,
            }}
          />
        )}

        {location && (
          <Marker
            position={[
              Number(location.latitude),
              Number(location.longitude),
            ]}
            icon={driverIcon}
          >
            <Popup>
              <strong>
                Driver's current location
              </strong>
            </Popup>
          </Marker>
        )}

        <MapUpdater
          location={location}
          sourcePlace={sourcePlace}
        />
      </MapContainer>

      <p
        className="card-meta"
        style={{ marginTop: "0.4rem" }}
      >
        {location
          ? connected
            ? "● Live — driver location updating in real time"
            : "Showing last known location — reconnecting..."
          : "Waiting for the driver to start sharing their location."}
      </p>

      {locationHistory.length > 1 && (
        <p className="card-meta">
          Tracked points: {locationHistory.length}
        </p>
      )}
    </div>
  );
}
