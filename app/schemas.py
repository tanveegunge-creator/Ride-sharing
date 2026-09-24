from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
import enum


# ================= ENUMS (mirror models.py) =================
class VehicleType(str, enum.Enum):
    AUTO = "auto"
    CAR = "car"
    BUS = "bus"


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
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole

    class Config:
        from_attributes = True


# ================= RIDES =================
class RideCreate(BaseModel):
    driver_id: int
    source_place_id: int
    destination_place_id: int
    departure_time: datetime
    vehicle_type: VehicleType
    total_seats: int          # capacity of the vehicle (e.g. auto=3, car=4/5, bus=6+)
    # price is no longer provided by the client — it's calculated from the
    # shortest-path distance between source_place_id and destination_place_id
    # at a fixed rate per km (see crud.RATE_PER_KM).


class RideResponse(BaseModel):
    ride_id: int
    driver_id: int
    source_place_id: int
    destination_place_id: int
    departure_time: datetime
    vehicle_type: VehicleType
    total_seats: int
    available_seats: int
    price: float
    status: str

    class Config:
        from_attributes = True


# ================= BOOKINGS =================
class BookingCreate(BaseModel):
    ride_id: int
    passenger_id: int
    seats_booked: int


class BookingResponse(BaseModel):
    booking_id: int
    ride_id: int
    passenger_id: int
    seats_booked: int
    status: BookingStatus
    fare_share: Optional[float] = None

    class Config:
        from_attributes = True


class BookingApprovalResponse(BaseModel):
    id: int
    booking_id: int
    approver_booking_id: int
    decision: ApprovalDecision
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApprovalDecisionRequest(BaseModel):
    # In production this should come from the JWT (current_user), not be passed in the body.
    approver_booking_id: int


# ================= AUTH =================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ================= PLACES =================
class PlaceCreate(BaseModel):
    place_name: str


class PlaceResponse(BaseModel):
    place_id: int
    place_name: str

    class Config:
        from_attributes = True


# ================= ROADS =================
class RoadCreate(BaseModel):
    source_place_id: int
    destination_place_id: int
    distance: int


class RoadResponse(BaseModel):
    road_id: int
    source_place_id: int
    destination_place_id: int
    distance: int

    class Config:
        from_attributes = True