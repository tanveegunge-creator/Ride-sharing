import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlaces, getRides, createBooking } from "../api/client";
import { getCurrentUserId, isLoggedIn } from "../utils/auth";

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
    Promise.all([getPlaces(), getRides()])
      .then(([placesRes, ridesRes]) => {
        setPlaces(placesRes.data);
        setAllRides(ridesRes.data);
      })
      .catch(() => setError("Could not load places/rides. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const placeName = (id) => places.find((p) => p.place_id === id)?.place_name || `Place ${id}`;

  const handleSearch = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!fromPlaceId || !toPlaceId) {
      setError("Pick both a From and To place.");
      return;
    }
    if (fromPlaceId === toPlaceId) {
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
      setError("Could not identify your account — please log in again.");
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
        setMessage(`Booked — your seat is confirmed. Your share of the fare is ₹${res.data.fare_share}.`);
      } else {
        setMessage("Request sent — this ride already has passengers, so it needs their approval first.");
      }
      const ridesRes = await getRides();
      setAllRides(ridesRes.data);
      setMatchingRides((prev) =>
        prev
          ? ridesRes.data.filter(
              (r) =>
                String(r.source_place_id) === String(fromPlaceId) &&
                String(r.destination_place_id) === String(toPlaceId)
            )
          : prev
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Booking failed.");
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page page-wide">
      <h2>Find a ride</h2>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1.8rem", flexWrap: "wrap" }}
      >
        <div className="field" style={{ marginBottom: 0, minWidth: 180 }}>
          <label>From</label>
          <select value={fromPlaceId} onChange={(e) => setFromPlaceId(e.target.value)}>
            <option value="">Select place</option>
            {places.map((p) => (
              <option key={p.place_id} value={p.place_id}>{p.place_name}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0, minWidth: 180 }}>
          <label>To</label>
          <select value={toPlaceId} onChange={(e) => setToPlaceId(e.target.value)}>
            <option value="">Select place</option>
            {places.map((p) => (
              <option key={p.place_id} value={p.place_id}>{p.place_name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn">Search</button>
      </form>

      {error && <p className="msg-error">{error}</p>}
      {message && <p className="msg-success">{message}</p>}

      {matchingRides !== null && (
        <div>
          <h3>{matchingRides.length} ride{matchingRides.length === 1 ? "" : "s"} found</h3>

          {matchingRides.length === 0 && (
            <p className="empty-state">No rides on this route right now — try a different search, or offer one yourself.</p>
          )}

          {matchingRides.map((ride) => (
            <div key={ride.ride_id} className="card">
              <div className="route">
                <div className="route-line">
                  <div className="route-dot" />
                  <div className="route-connector" />
                  <div className="route-dot end" />
                </div>
                <div className="route-places">
                  <span>{placeName(ride.source_place_id)}</span>
                  <span>{placeName(ride.destination_place_id)}
                    <span className="sub">{new Date(ride.departure_time).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <p className="card-meta">
                {ride.vehicle_type} · {ride.available_seats}/{ride.total_seats} seats left
              </p>
              <p>
                <span className="card-price">₹{ride.price}</span>
                <span className="card-price-sub">total, split among approved passengers</span>
              </p>

              <div style={{ display: "flex", alignItems: "center", marginTop: "0.8rem" }}>
                <input
                  type="number"
                  min="1"
                  max={ride.available_seats}
                  value={seatsByRide[ride.ride_id] || 1}
                  onChange={(e) =>
                    setSeatsByRide({ ...seatsByRide, [ride.ride_id]: parseInt(e.target.value, 10) || 1 })
                  }
                  className="seat-input"
                />
                <button onClick={() => handleBook(ride.ride_id)} className="btn">Book</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}