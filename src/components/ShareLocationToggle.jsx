// ShareLocationToggle.jsx — mounted on the driver's own ride card in MyRides.jsx.
// Watches the browser's GPS and pushes updates while toggled on.

import { useEffect, useRef, useState } from "react";
import { pushRideLocation } from "../hooks/useRideTracking";

export default function ShareLocationToggle({ rideId }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Stop sharing if the component unmounts (e.g. navigating away)
    // while it was still on.
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const start = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported by this browser.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => pushRideLocation(rideId, pos.coords.latitude, pos.coords.longitude),
      () => setError("Couldn't get your location — check location permissions."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setSharing(true);
  };

  const stop = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  return (
    <div style={{ marginTop: "0.8rem" }}>
      <button
        type="button"
        className={sharing ? "btn-secondary" : "btn"}
        style={{ borderRadius: 6, padding: "0.4rem 0.8rem", cursor: "pointer" }}
        onClick={sharing ? stop : start}
      >
        {sharing ? "Stop sharing location" : "Share live location"}
      </button>
      {sharing && <span style={{ marginLeft: "0.6rem", color: "#4a4" }}>● Live</span>}
      {error && <p className="msg-error" style={{ marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
}
