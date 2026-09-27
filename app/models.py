from sqlalchemy import (
    Column, Integer, String, ForeignKey, Numeric, TIMESTAMP, Enum, func, Float
)
from sqlalchemy.orm import relationship
from .database import Base
import enum


# ================= ENUMS =================
class VehicleType(str, enum.Enum):
    AUTO = "auto"   # 3-seater
    CAR = "car"     # 4-5 seater
    BUS = "bus"     # 6+ seater


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ApprovalDecision(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class UserRole(str, enum.Enum):
    DRIVER = "driver"
    PASSENGER = "passenger"


# ================= USERS =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, unique=True)
    role = Column(Enum(UserRole), nullable=False)   # fixed at signup: driver or passenger

    rides = relationship("Ride", back_populates="driver")
    bookings = relationship("Booking", back_populates="passenger")


# ================= PLACES =================
class Place(Base):
    __tablename__ = "places"

    place_id = Column(Integer, primary_key=True, index=True)
    place_name = Column(String(100), unique=True, nullable=False)

    # Nullable: existing places won't have these until backfilled via
    # PATCH /places/{place_id}/location. A place with no coordinates
    # simply isn't drawn on the map.
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    source_rides = relationship(
        "Ride", foreign_keys="Ride.source_place_id", back_populates="source_place"
    )
    destination_rides = relationship(
        "Ride", foreign_keys="Ride.destination_place_id", back_populates="destination_place"
    )


# ================= ROADS =================
class Road(Base):
    __tablename__ = "roads"

    road_id = Column(Integer, primary_key=True, index=True)
    source_place_id = Column(Integer, ForeignKey("places.place_id"), nullable=False)
    destination_place_id = Column(Integer, ForeignKey("places.place_id"), nullable=False)
    distance = Column(Integer, nullable=False)

    source_place = relationship("Place", foreign_keys=[source_place_id])
    destination_place = relationship("Place", foreign_keys=[destination_place_id])


# ================= RIDES =================
class Ride(Base):
    __tablename__ = "rides"

    ride_id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_place_id = Column(Integer, ForeignKey("places.place_id"), nullable=False)
    destination_place_id = Column(Integer, ForeignKey("places.place_id"), nullable=False)
    departure_time = Column(TIMESTAMP, nullable=False)

    vehicle_type = Column(Enum(VehicleType), nullable=False, default=VehicleType.CAR)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)

    price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="available")

    driver = relationship("User", back_populates="rides")
    bookings = relationship("Booking", back_populates="ride")
    source_place = relationship("Place", foreign_keys=[source_place_id], back_populates="source_rides")
    destination_place = relationship("Place", foreign_keys=[destination_place_id], back_populates="destination_rides")


# ================= BOOKINGS =================
class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.ride_id"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seats_booked = Column(Integer, nullable=False)

    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    fare_share = Column(Numeric(10, 2), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    ride = relationship("Ride", back_populates="bookings")
    passenger = relationship("User", back_populates="bookings")
    approvals = relationship("BookingApproval", back_populates="booking",
                              foreign_keys="BookingApproval.booking_id")


# ================= BOOKING APPROVALS =================
class BookingApproval(Base):
    """
    One row per (pending booking, existing approved passenger who must approve it).
    A pending booking with N existing approved passengers spawns N approval rows.
    """
    __tablename__ = "booking_approvals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)
    approver_booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)
    decision = Column(Enum(ApprovalDecision), nullable=False, default=ApprovalDecision.PENDING)
    responded_at = Column(TIMESTAMP, nullable=True)

    booking = relationship("Booking", back_populates="approvals", foreign_keys=[booking_id])
    approver_booking = relationship("Booking", foreign_keys=[approver_booking_id])


# ================= LIVE RIDE LOCATION =================
class RideLocation(Base):
    """
    One row per ride, overwritten on every update from the driver's device.
    This is the 'last known position' — used both as the initial value a
    passenger sees before the WebSocket connects, and as a fallback if they
    reconnect later (e.g. after a phone locks and drops the socket).
    """
    __tablename__ = "ride_locations"

    ride_id = Column(Integer, ForeignKey("rides.ride_id"), primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    ride = relationship("Ride")
