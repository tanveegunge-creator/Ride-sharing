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
    roads,
    tracking,
)

app = FastAPI(
    title="Ride Sharing API",
    description="Ride Sharing System using FastAPI and PostgreSQL",
    version="1.0",
)

# Allow the local React frontend and deployed frontend to access the API.
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ride-sharing-frontend-q35l6bpr4-t5-f6cf.vercel.app",
        "https://ride-sharing-frontend.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables using your existing models.
Base.metadata.create_all(bind=engine)

# Register all application routes.
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rides.router)
app.include_router(bookings.router)
app.include_router(places.router)
app.include_router(roads.router)
app.include_router(tracking.router)


@app.get("/")
def root():
    return {
        "message": "Ride Sharing API is running successfully!"
    }
