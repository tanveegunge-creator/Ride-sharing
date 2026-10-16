import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import BookRide from "./pages/BookRide";
import CreateRide from "./pages/CreateRide";
import Approvals from "./pages/Approvals";
import MyBookings from "./pages/MyBookings";
import MyRides from "./pages/MyRides";
import { useAuthStatus, logout } from "./utils/auth";

function Navbar() {
  const loggedIn = useAuthStatus();
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="route-dot" style={{ display: "inline-block" }} />
        Ride Sharing
      </Link>
      <div className="navbar-links">
        {loggedIn ? (
          <>
            <Link to="/book">Find a ride</Link>
            <Link to="/create-ride">Offer a ride</Link>
            <Link to="/approvals">Approvals</Link>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/my-rides">My Rides</Link>
            <button
              className="btn-secondary"
              style={{ borderRadius: 6, padding: "0.4rem 0.8rem", cursor: "pointer" }}
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/signup">Sign up</Link>
            <Link to="/login">Log in</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Home() {
  const loggedIn = useAuthStatus();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Pune · Carpool · Split fares</span>
          <h1 className="hero-title">
            Get where you're going,
            <br />
            <span className="accent">split the way there.</span>
          </h1>
          <p className="hero-lead">
            Offer a seat or book one. Pick your route on the map, see the fare
            before you commit, and follow your ride live.
          </p>
          <div className="hero-cta">
            {loggedIn ? (
              <>
                <Link className="btn btn-lg" to="/book">Find a ride</Link>
                <Link className="btn btn-secondary btn-lg" to="/create-ride">Offer a ride</Link>
              </>
            ) : (
              <>
                <Link className="btn btn-lg" to="/signup">Get started</Link>
                <Link className="btn btn-secondary btn-lg" to="/login">Log in</Link>
              </>
            )}
          </div>
        </div>

        <svg className="hero-art" viewBox="0 0 320 220" aria-hidden="true">
          <path id="trip" d="M40 170 C 100 20, 220 220, 280 50"
                fill="none" stroke="#2c3459" strokeWidth="3" strokeDasharray="6 8" />
          <circle cx="40" cy="170" r="9" fill="#4caf6d" />
          <circle cx="280" cy="50" r="9" fill="#e8624a" />
          <circle r="7" fill="#e8a33d">
            <animateMotion dur="5s" repeatCount="indefinite">
              <mpath href="#trip" />
            </animateMotion>
          </circle>
        </svg>
      </section>

      <section className="steps">
        <div className="step">
          <span className="step-num">1</span>
          <h3>Pick on the map</h3>
          <p>Tap a start and a destination. The route and fare appear instantly.</p>
        </div>
        <div className="step">
          <span className="step-num">2</span>
          <h3>Share the ride</h3>
          <p>Fares split automatically between approved riders.</p>
        </div>
        <div className="step">
          <span className="step-num">3</span>
          <h3>Track it live</h3>
          <p>Follow the driver on the map in real time.</p>
        </div>
      </section>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/book" element={<BookRide />} />
          <Route path="/create-ride" element={<CreateRide />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-rides" element={<MyRides />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
