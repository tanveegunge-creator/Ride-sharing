
import axios from "axios";

// --------------------------------------------------
// BASE URL
// --------------------------------------------------

const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://ride-sharing-t930.onrender.com"
).replace(/\/+$/, "");

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

export const login = (email, password) =>
  client.post("/auth/login", {
    email,
    password,
  });

// --------------------------------------------------
// USERS
// --------------------------------------------------

export const createUser = (user) =>
  client.post("/users/", user);

// --------------------------------------------------
// PLACES
// --------------------------------------------------

export const getPlaces = () =>
  client.get("/places/");

export const createPlace = (place) =>
  client.post("/places/", place);

export const updatePlaceLocation = (
  placeId,
  latitude,
  longitude
) =>
  client.patch(`/places/${placeId}/location`, {
    latitude,
    longitude,
  });

// --------------------------------------------------
// ROADS AND ROUTE CALCULATION
// --------------------------------------------------

export const getRoads = () =>
  client.get("/roads/");

export const createRoad = (road) =>
  client.post("/roads/", road);

export const getShortestPath = (
  sourceId,
  destinationId
) =>
  client.get("/roads/shortest-path/", {
    params: {
      source_id: sourceId,
      destination_id: destinationId,
    },
  });

// --------------------------------------------------
// RIDES
// --------------------------------------------------

export const getRides = () =>
  client.get("/rides/");

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

// --------------------------------------------------
// BOOKINGS
// --------------------------------------------------

export const getBookings = () =>
  client.get("/bookings/");

export const getBooking = (bookingId) =>
  client.get(`/bookings/${bookingId}`);

export const createBooking = (booking) =>
  client.post("/bookings/", booking);

export const getBookingApprovals = (bookingId) =>
  client.get(`/bookings/${bookingId}/approvals`);

export const approveBooking = (
  bookingId,
  approverBookingId
) =>
  client.post(`/bookings/${bookingId}/approve`, {
    approver_booking_id: approverBookingId,
  });

export const rejectBooking = (
  bookingId,
  approverBookingId
) =>
  client.post(`/bookings/${bookingId}/reject`, {
    approver_booking_id: approverBookingId,
  });

// --------------------------------------------------
// PAYMENTS
// --------------------------------------------------

export const payBooking = (
  bookingId,
  paymentDetails = {}
) =>
  client.post(
    `/bookings/${bookingId}/pay`,
    paymentDetails
  );

export const getPaymentInfo = (bookingId) =>
  client.get(`/bookings/${bookingId}/payment`);

export const confirmPayment = (
  bookingId,
  paymentDetails = {}
) =>
  client.post(
    `/bookings/${bookingId}/confirm-payment`,
    paymentDetails
  );

// --------------------------------------------------
// LOCATION TRACKING
// --------------------------------------------------

export const updateRideLocation = (
  rideId,
  latitude,
  longitude
) =>
  client.put(`/rides/${rideId}/location`, {
    latitude,
    longitude,
  });

export const getRideLocation = (rideId) =>
  client.get(`/rides/${rideId}/location`);

// --------------------------------------------------
// WEBSOCKET URL FOR LIVE RIDE TRACKING
// --------------------------------------------------

export const WS_BASE_URL = BASE_URL.replace(
  /^http/,
  "ws"
);

// --------------------------------------------------
// DEFAULT AXIOS CLIENT
// --------------------------------------------------

export default client;
