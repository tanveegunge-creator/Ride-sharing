// useRideTracking.js
//
// Gets the driver's location for a ride two ways:
//   1. An initial REST GET, so there's something to show immediately
//      (and so it still works if the WebSocket fails to connect).
//   2. A WebSocket subscription for live updates after that.
//
// Used by both the driver's ShareLocationToggle (to know if it's already
// connected) and the passenger's RideMap (to receive live position pushes).

import { useEffect, useRef, useState } from "react";
import { getRideLocation, updateRideLocation, WS_BASE_URL } from "../api/client";

export function useRideTracking(rideId) {
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!rideId) return;

    let cancelled = false;

    // 1. Initial value via REST — ignore a 404 (no one has shared a
    // location for this ride yet), that's an expected state, not an error.
    getRideLocation(rideId)
      .then((res) => {
        if (!cancelled) setLocation(res.data);
      })
      .catch(() => {});

    // 2. Live updates via WebSocket
    const ws = new WebSocket(`${WS_BASE_URL}/rides/ws/${rideId}/track`);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("Tracking socket error:", err);
    ws.onmessage = (event) => setLocation(JSON.parse(event.data));

    return () => {
      cancelled = true;
      ws.close();
    };
  }, [rideId]);

  return { location, connected };
}

// Separate from the hook above: called by the driver's side to push a new
// position. This is a plain REST call (not sent over the WebSocket) — the
// backend persists it and rebroadcasts to anyone subscribed via the hook
// above.
export function pushRideLocation(rideId, latitude, longitude) {
  return updateRideLocation(rideId, latitude, longitude).catch((err) =>
    console.error("Failed to push location:", err)
  );
}
