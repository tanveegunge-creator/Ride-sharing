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


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    ONLINE = "online"


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
    phone: Optional[str] = None
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
    total_seats: int
    vehicle_number: str
    upi_id: Optional[str] = None


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
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    stopped_place_id: Optional[int] = None
    final_price: Optional[float] = None

    class Config:
        from_attributes = True


class StartRideRequest(BaseModel):
    driver_id: int


class EndRideRequest(BaseModel):
    driver_id: int
    # None (or the destination) = completed normally; any other place = stopped midway
    stopped_place_id: Optional[int] = None


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

    # ride end / payment
    final_fare: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"
    paid_at: Optional[datetime] = None

    # driver details (phone only when the booking is approved)
    ride_status: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None

    class Config:
        from_attributes = True


class RideBookingResponse(BaseModel):
    """What a driver sees for each booking on their own ride."""
    booking_id: int
    passenger_id: int
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    seats_booked: int
    status: BookingStatus
    fare_share: Optional[float] = None
    final_fare: Optional[float] = None
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"

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
    approver_booking_id: int


# ================= PAYMENTS =================
class PayRequest(BaseModel):
    passenger_id: int
    method: PaymentMethod


class ConfirmPaymentRequest(BaseModel):
    driver_id: int


class PaymentInfo(BaseModel):
    amount: float
    upi_id: str
    payee_name: str
    upi_link: str
    note: str


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
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PlaceResponse(BaseModel):
    place_id: int
    place_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class PlaceLocationUpdate(BaseModel):
    latitude: float
    longitude: float


# ================= LIVE RIDE LOCATION =================
class RideLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class RideLocationResponse(BaseModel):
    ride_id: int
    latitude: float
    longitude: float
    updated_at: Optional[datetime] = None

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
