import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getPlaces,
  getRides,
  createBooking,
} from "../api/client";

import {
  getCurrentUserId,
  isLoggedIn,
} from "../utils/auth";

import MapPlacePicker from "../components/MapPlacePicker";
import RouteMap from "../components/RouteMap";

export default function BookRide() {
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [allRides, setAllRides] = useState([]);

  const [fromPlaceId, setFromPlaceId] = useState("");
  const [toPlaceId, setToPlaceId] = useState("");

  const [matchingRides, setMatchingRides] = useState(null);

  const [seatsByRide, setSeatsByRide] = useState({});

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    Promise.all([
      getPlaces(),
      getRides(),
    ])
      .then(([placesRes, ridesRes]) => {
        setPlaces(placesRes.data);
        setAllRides(ridesRes.data);
      })
      .catch(() =>
        setError(
          "Could not load places/rides. Is the backend running?"
        )
      )
      .finally(() => setLoading(false));
  }, [navigate]);

  const placeName = (id) =>
    places.find(
      (p) => String(p.place_id) === String(id)
    )?.place_name || `Place ${id}`;

  const sourcePlace = places.find(
    (p) => String(p.place_id) === String(fromPlaceId)
  );

  const destinationPlace = places.find(
    (p) => String(p.place_id) === String(toPlaceId)
  );

  const handleSearch = () => {
    setMessage("");
    setError("");
    setMatchingRides(null);

    if (!fromPlaceId || !toPlaceId) {
      setError("Select both From and To on the map.");
      return;
    }

    if (String(fromPlaceId) === String(toPlaceId)) {
      setError("From and To can't be the same place.");
      return;
    }

    const matches = allRides.filter(
      (ride) =>
        String(ride.source_place_id) === String(fromPlaceId) &&
        String(ride.destination_place_id) === String(toPlaceId) &&
        ride.available_seats > 0
    );

    setMatchingRides(matches);
  };

  const handleBook = async (rideId) => {
    setMessage("");
    setError("");

    const passengerId = getCurrentUserId();

    if (!passengerId) {
      setError(
        "Could not identify your account — please log in again."
      );
      return;
    }

    const seats = seatsByRide[rideId] || 1;

    try {
      const res = await createBooking({
        ride_id: rideId,
        passenger_id: passengerId,
        seats_booked: seats,
      });

      const status = res.data.status;

      if (status === "approved") {
        setMessage(
          `Booked — your seat is confirmed. Your share of the fare is ₹${res.data.fare_share}.`
        );
      } else {
        setMessage(
          "Request sent — this ride already has passengers, so it needs their approval first."
        );
      }

      const ridesRes = await getRides();

      setAllRides(ridesRes.data);

      setMatchingRides(
        ridesRes.data.filter(
          (r) =>
            String(r.source_place_id) ===
              String(fromPlaceId) &&
            String(r.destination_place_id) ===
              String(toPlaceId) &&
            r.available_seats > 0
        )
      );
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Booking failed."
      );
    }
  };

  if (loading) {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <h2>Find a ride</h2>

      <p className="hint">
        Select your starting point and destination directly
        from the map.
      </p>

      <MapPlacePicker
        places={places}
        fromPlaceId={fromPlaceId}
        toPlaceId={toPlaceId}
        onFromChange={setFromPlaceId}
        onToChange={setToPlaceId}
      />

      {sourcePlace && destinationPlace && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Selected route</h3>

          <p className="card-meta">
            {sourcePlace.place_name} →{" "}
            {destinationPlace.place_name}
          </p>

          <RouteMap
            sourcePlace={sourcePlace}
            destinationPlace={destinationPlace}
          />

          <button
            type="button"
            className="btn"
            style={{ marginTop: "1rem" }}
            onClick={handleSearch}
          >
            Search Rides
          </button>
        </div>
      )}

      {error && (
        <p className="msg-error">
          {error}
        </p>
      )}

      {message && (
        <p className="msg-success">
          {message}
        </p>
      )}

      {matchingRides !== null && (
        <div style={{ marginTop: "2rem" }}>
          <h3>
            {matchingRides.length} ride
            {matchingRides.length === 1 ? "" : "s"} found
          </h3>

          {matchingRides.length === 0 && (
            <p className="empty-state">
              No rides on this route right now —
              try a different search, or offer one yourself.
            </p>
          )}

          {matchingRides.map((ride) => (
            <div
              key={ride.ride_id}
              className="card"
            >
              <div className="route">
                <div className="route-line">
                  <div className="route-dot" />

                  <div className="route-connector" />

                  <div className="route-dot end" />
                </div>

                <div className="route-places">
                  <span>
                    {placeName(ride.source_place_id)}
                  </span>

                  <span>
                    {placeName(
                      ride.destination_place_id
                    )}

                    <span className="sub">
                      {new Date(
                        ride.departure_time
                      ).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>

              <p className="card-meta">
                {ride.vehicle_type} ·{" "}
                {ride.available_seats}/
                {ride.total_seats} seats left
              </p>

              <p>
                <span className="card-price">
                  ₹{ride.price}
                </span>

                <span className="card-price-sub">
                  total, split among approved passengers
                </span>
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "0.8rem",
                }}
              >
                <input
                  type="number"
                  min="1"
                  max={ride.available_seats}
                  value={
                    seatsByRide[ride.ride_id] || 1
                  }
                  onChange={(e) =>
                    setSeatsByRide({
                      ...seatsByRide,
                      [ride.ride_id]:
                        parseInt(
                          e.target.value,
                          10
                        ) || 1,
                    })
                  }
                  className="seat-input"
                />

                <button
                  type="button"
                  onClick={() =>
                    handleBook(ride.ride_id)
                  }
                  className="btn"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
