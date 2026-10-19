
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://ride-sharing-t930.onrender.com";

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication and users
export const login = (email, password) =>
  client.post("/auth/login", { email, password });

export const createUser = (user) =>
  client.post("/users/", user);

// Places
export const getPlaces = () => client.get("/places/");

export const createPlace = (place) =>
  client.post("/places/", place);

// Roads and shortest path
export const getRoads = () => client.get("/roads/");

export const createRoad = (road) =>
  client.post("/roads/", road);

export const getShortestPath = (sourceId, destinationId) =>
  client.get("/roads/shortest-path/", {
    params: {
      source_id: sourceId,
      destination_id: destinationId,
    },
  });

// Rides
export const getRides = () => client.get("/rides/");

export const getRide = (rideId) =>
  client.get(`/rides/${rideId}`);

export const createRide = (ride) =>
  client.post("/rides/", ride);

export const startRide = (rideId) =>
  client.patch(`/rides/${rideId}/start`);

export const endRide = (rideId) =>
  client.patch(`/rides/${rideId}/end`);

export const getRideBookings = (rideId) =>
  client.get(`/rides/${rideId}/bookings`);

// Bookings
export const getBookings = () => client.get("/bookings/");

export const getBooking = (bookingId) =>
  client.get(`/bookings/${bookingId}`);

export const createBooking = (booking) =>
  client.post("/bookings/", booking);

export const getBookingApprovals = (bookingId) =>
  client.get(`/bookings/${bookingId}/approvals`);

export const approveBooking = (bookingId, approverBookingId) =>
  client.post(`/bookings/${bookingId}/approve`, {
    approver_booking_id: approverBookingId,
  });

export const rejectBooking = (bookingId, approverBookingId) =>
  client.post(`/bookings/${bookingId}/reject`, {
    approver_booking_id: approverBookingId,
  });

// Payments
export const payBooking = (bookingId, paymentDetails = {}) =>
  client.post(`/bookings/${bookingId}/pay`, paymentDetails);

export const getPaymentInfo = (bookingId) =>
  client.get(`/bookings/${bookingId}/payment`);

export const confirmPayment = (bookingId, paymentDetails = {}) =>
  client.post(
    `/bookings/${bookingId}/confirm-payment`,
    paymentDetails
  );

// Location and tracking
export const updatePlaceLocation = (placeId, latitude, longitude) =>
  client.patch(`/places/${placeId}/location`, {
    latitude,
    longitude,
  });

export const updateRideLocation = (rideId, latitude, longitude) =>
  client.put(`/rides/${rideId}/location`, {
    latitude,
    longitude,
  });

export const getRideLocation = (rideId) =>
  client.get(`/rides/${rideId}/location`);

export const WS_BASE_URL = BASE_URL.replace(/^http/, "ws");

export default client;
