import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlaces, createRide } from "../api/client";
import { getCurrentUserId, isLoggedIn } from "../utils/auth";

export default function CreateRide() {
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState({
    source_place_id: "",
    destination_place_id: "",
    departure_time: "",
    vehicle_type: "car",
    total_seats: 4,
  });
  const [error, setError] = useState("");
  const [createdRide, setCreatedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    getPlaces()
      .then((res) => setPlaces(res.data))
      .catch(() => setError("Could not load places. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const placeName = (id) => places.find((p) => String(p.place_id) === String(id))?.place_name || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "total_seats" ? parseInt(value, 10) || "" : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreatedRide(null);

    const driverId = getCurrentUserId();
    if (!driverId) {
      setError("Could not identify your account — please log in again.");
      return;
    }
    if (!form.source_place_id || !form.destination_place_id) {
      setError("Pick both a source and destination place.");
      return;
    }
    if (form.source_place_id === form.destination_place_id) {
      setError("Source and destination can't be the same place.");
      return;
    }
    if (!form.departure_time) {
      setError("Pick a departure time.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createRide({
        driver_id: driverId,
        source_place_id: parseInt(form.source_place_id, 10),
        destination_place_id: parseInt(form.destination_place_id, 10),
        departure_time: form.departure_time,
        vehicle_type: form.vehicle_type,
        total_seats: form.total_seats,
      });
      setCreatedRide(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not create ride.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h2>Offer a ride</h2>
      <p className="hint">Price isn't entered manually — it's calculated from road distance once you submit.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>From</label>
          <select name="source_place_id" value={form.source_place_id} onChange={handleChange}>
            <option value="">Select place</option>
            {places.map((p) => (
              <option key={p.place_id} value={p.place_id}>{p.place_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>To</label>
          <select name="destination_place_id" value={form.destination_place_id} onChange={handleChange}>
            <option value="">Select place</option>
            {places.map((p) => (
              <option key={p.place_id} value={p.place_id}>{p.place_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Departure time</label>
          <input type="datetime-local" name="departure_time" value={form.departure_time} onChange={handleChange} />
        </div>

        <div className="field">
          <label>Vehicle type</label>
          <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
            <option value="auto">Auto (3-seater)</option>
            <option value="car">Car (4-5 seater)</option>
            <option value="bus">Bus (6+ seater)</option>
          </select>
        </div>

        <div className="field">
          <label>Total seats</label>
          <input type="number" name="total_seats" min="1" value={form.total_seats} onChange={handleChange} />
        </div>

        {error && <p className="msg-error">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Creating..." : "Create Ride"}
        </button>
      </form>

      {createdRide && (
        <div className="card" style={{ marginTop: "1.8rem" }}>
          <h3>Ride created</h3>
          <div className="route">
            <div className="route-line">
              <div className="route-dot" />
              <div className="route-connector" />
              <div className="route-dot end" />
            </div>
            <div className="route-places">
              <span>{placeName(form.source_place_id)}</span>
              <span>{placeName(form.destination_place_id)}</span>
            </div>
          </div>
          <p className="card-meta">
            {createdRide.vehicle_type} · {createdRide.available_seats}/{createdRide.total_seats} seats · {createdRide.status}
          </p>
          <p className="card-price">₹{createdRide.price}</p>
        </div>
      )}
    </div>
  );
}