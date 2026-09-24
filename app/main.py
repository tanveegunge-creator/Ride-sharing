from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routes import (
    users,
    rides,
    bookings,
    auth,
    places,
    roads
)

# Create all tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Ride Sharing API",
    description="Ride Sharing System using FastAPI and PostgreSQL",
    version="1.0"
)

# Allow the React dev server (Vite) to call this API from the browser.
# In production, replace "*" / this list with your actual deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rides.router)
app.include_router(bookings.router)
app.include_router(places.router)
app.include_router(roads.router)

# Home route
@app.get("/")
def root():
    return {
        "message": "Ride Sharing API is running successfully!"
    }