import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRides, getBookings, getPlaces } from "../api/client";
import { getCurrentUserId, isLoggedIn } from "../utils/auth";

export default function MyRides() {
  const navigate = useNavigate();

  const [myRides, setMyRides] = useState([]);
  const [bookingsByRide, setBookingsByRide] = useState({});
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const placeName = (id) => places.find((p) => p.place_id === id)?.place_name || `Place ${id}`;

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    const myUserId = getCurrentUserId();
    if (!myUserId) {
      setError("Could not identify your account — please log in again.");
      setLoading(false);
      return;
    }

    Promise.all([getRides(), getBookings(), getPlaces()])
      .then(([ridesRes, bookingsRes, placesRes]) => {
        const mine = ridesRes.data.filter((r) => r.driver_id === myUserId);
        setMyRides(mine);
        setPlaces(placesRes.data);

        const grouped = {};
        for (const ride of mine) {
          grouped[ride.ride_id] = bookingsRes.data.filter((b) => b.ride_id === ride.ride_id);
        }
        setBookingsByRide(grouped);
      })
      .catch(() => setError("Could not load your rides. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page page-wide">
      <h2>My rides</h2>

      {error && <p className="msg-error">{error}</p>}

      {myRides.length === 0 ? (
        <p className="empty-state">You haven't created any rides yet.</p>
      ) : (
        myRides.map((ride) => {
          const passengers = bookingsByRide[ride.ride_id] || [];
          return (
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
                    <span className="sub">{new Date(ride.departure_time).toLocaleString()} · {ride.vehicle_type}</span>
                  </span>
                </div>
              </div>

              <p className="card-meta">
                {ride.total_seats - ride.available_seats}/{ride.total_seats} seats filled · {ride.status}
              </p>
              <p className="card-price">₹{ride.price}<span className="card-price-sub">total fare</span></p>

              {passengers.length === 0 ? (
                <p className="card-meta" style={{ marginTop: "0.8rem" }}>No bookings yet.</p>
              ) : (
                <ul className="passenger-list">
                  {passengers.map((b) => (
                    <li key={b.booking_id}>
                      <span>Passenger #{b.passenger_id} · {b.seats_booked} seat(s)</span>
                      <span className={`status ${b.status}`}>
                        <span className="status-dot" />
                        {b.status}
                        {b.status === "approved" && b.fare_share != null && ` · ₹${b.fare_share}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}