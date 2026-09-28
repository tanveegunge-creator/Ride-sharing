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
    tracking
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ride Sharing API",
    description="Ride Sharing System using FastAPI and PostgreSQL",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ride-sharing-frontend.onrender.com",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
