import axios from "axios";

// Your FastAPI backend's base URL.
const BASE_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= AUTH =================
export const login = (email, password) =>
  client.post("/auth/login", { email, password });

// ================= USERS =================
export const createUser = (user) =>
  // user: { name, email, password, phone, role: "driver" | "passenger" }
  client.post("/users/", user);

// ================= PLACES =================
export const getPlaces = () => client.get("/places/");

export const createPlace = (place) =>
  // place: { place_name }
  client.post("/places/", place);

// ================= ROADS =================
export const getRoads = () => client.get("/roads/");

export const createRoad = (road) =>
  // road: { source_place_id, destination_place_id, distance }
  client.post("/roads/", road);

export const getShortestPath = (sourceId, destinationId) =>
  client.get("/roads/shortest-path/", {
    params: { source_id: sourceId, destination_id: destinationId },
  });

// ================= RIDES =================
export const getRides = () => client.get("/rides/");

export const getRide = (rideId) => client.get(`/rides/${rideId}`);

export const createRide = (ride) =>
  // ride: { driver_id, source_place_id, destination_place_id, departure_time, vehicle_type, total_seats }
  // NOTE: price is NOT sent — the backend calculates it from distance x rate.
  client.post("/rides/", ride);

// ================= BOOKINGS =================
export const getBookings = () => client.get("/bookings/");

export const getBooking = (bookingId) => client.get(`/bookings/${bookingId}`);

export const createBooking = (booking) =>
  // booking: { ride_id, passenger_id, seats_booked }
  client.post("/bookings/", booking);

export const getBookingApprovals = (bookingId) =>
  client.get(`/bookings/${bookingId}/approvals`);

export const approveBooking = (bookingId, approverBookingId) =>
  // Current backend version takes approver_booking_id in the body.
  // If/when you switch to the JWT-authenticated version, this call
  // simplifies to client.post(`/bookings/${bookingId}/approve`) with
  // an Authorization header instead — no body needed.
  client.post(`/bookings/${bookingId}/approve`, {
    approver_booking_id: approverBookingId,
  });

export const rejectBooking = (bookingId, approverBookingId) =>
  client.post(`/bookings/${bookingId}/reject`, {
    approver_booking_id: approverBookingId,
  });

export default client;