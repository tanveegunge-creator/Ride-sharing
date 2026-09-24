import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBookings, getRides, getPlaces } from "../api/client";
import { getCurrentUserId, isLoggedIn } from "../utils/auth";

const statusColor = {
  approved: "#4a4",
  pending: "#c90",
  rejected: "#c44",
  cancelled: "#888",
};

export default function MyBookings() {
  const navigate = useNavigate();

  const [myBookings, setMyBookings] = useState([]);
  const [rides, setRides] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const placeName = (id) => places.find((p) => p.place_id === id)?.place_name || `Place ${id}`;
  const rideFor = (rideId) => rides.find((r) => r.ride_id === rideId);

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

    Promise.all([getBookings(), getRides(), getPlaces()])
      .then(([bookingsRes, ridesRes, placesRes]) => {
        setMyBookings(bookingsRes.data.filter((b) => b.passenger_id === myUserId));
        setRides(ridesRes.data);
        setPlaces(placesRes.data);
      })
      .catch(() => setError("Could not load your bookings. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: "1rem" }}>
      <h2>My Bookings</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {myBookings.length === 0 ? (
        <p>You haven't booked any rides yet.</p>
      ) : (
        myBookings.map((booking) => {
          const ride = rideFor(booking.ride_id);
          return (
            <div
              key={booking.booking_id}
              style={{ border: "1px solid #444", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}
            >
              {ride ? (
                <p>
                  <strong>{placeName(ride.source_place_id)} → {placeName(ride.destination_place_id)}</strong>
                  {" "}({ride.vehicle_type})
                </p>
              ) : (
                <p><strong>Ride #{booking.ride_id}</strong></p>
              )}

              {ride && <p>Departure: {new Date(ride.departure_time).toLocaleString()}</p>}
              <p>Seats booked: {booking.seats_booked}</p>

              <p>
                Status:{" "}
                <span style={{ color: statusColor[booking.status] || "#ccc", fontWeight: "bold" }}>
                  {booking.status}
                </span>
              </p>

              {booking.status === "approved" && booking.fare_share != null && (
                <p>Your share of the fare: ₹{booking.fare_share}</p>
              )}
              {booking.status === "pending" && (
                <p style={{ color: "#c90" }}>Waiting on approval from existing passengers.</p>
              )}
              {booking.status === "rejected" && (
                <p style={{ color: "#c44" }}>This request was declined.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}