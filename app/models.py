from sqlalchemy import (
    Column, Integer, String, ForeignKey, Numeric, TIMESTAMP, Enum, func
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

    # NEW: vehicle type + capacity
    vehicle_type = Column(Enum(VehicleType), nullable=False, default=VehicleType.CAR)
    total_seats = Column(Integer, nullable=False)          # fixed capacity of the vehicle
    available_seats = Column(Integer, nullable=False)      # seats not yet held (pending+approved reduce this)

    price = Column(Numeric(10, 2), nullable=False)         # total fare for the ride
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

    # NEW: approval state + fare split
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    fare_share = Column(Numeric(10, 2), nullable=True)   # computed once approved
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
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)          # the new/pending booking
    approver_booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)  # existing passenger's booking
    decision = Column(Enum(ApprovalDecision), nullable=False, default=ApprovalDecision.PENDING)
    responded_at = Column(TIMESTAMP, nullable=True)

    booking = relationship("Booking", back_populates="approvals", foreign_keys=[booking_id])
    approver_booking = relationship("Booking", foreign_keys=[approver_booking_id])