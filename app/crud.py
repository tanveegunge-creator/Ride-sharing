from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from . import models, schemas
from .auth import hash_password, verify_password


# ================= USERS =================
def create_user(db: Session, user: schemas.UserCreate):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ================= LOGIN =================
def login_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


# ================= RIDES =================
# Fare rate — total ride price is calculated as distance (from Dijkstra) x this rate.
RATE_PER_KM = 25


def create_ride(db: Session, ride: schemas.RideCreate):
    driver = db.query(models.User).filter(models.User.id == ride.driver_id).first()
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.role != models.UserRole.DRIVER:
        raise HTTPException(status_code=400, detail="This user's role is not 'driver'")

    source = db.query(models.Place).filter(models.Place.place_id == ride.source_place_id).first()
    if source is None:
        raise HTTPException(status_code=404, detail="Source place not found")

    destination = db.query(models.Place).filter(models.Place.place_id == ride.destination_place_id).first()
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination place not found")

    if ride.total_seats <= 0:
        raise HTTPException(status_code=400, detail="total_seats must be greater than 0")

    # Calculate distance via Dijkstra over Places/Roads, then price = distance x RATE_PER_KM
    route = find_shortest_path(db, ride.source_place_id, ride.destination_place_id)
    if not route["path"]:
        raise HTTPException(
            status_code=400,
            detail="No road route exists between source and destination"
        )
    calculated_price = route["distance"] * RATE_PER_KM

    db_ride = models.Ride(
        driver_id=ride.driver_id,
        source_place_id=ride.source_place_id,
        destination_place_id=ride.destination_place_id,
        departure_time=ride.departure_time,
        vehicle_type=ride.vehicle_type,
        total_seats=ride.total_seats,
        available_seats=ride.total_seats,   # starts full at creation
        price=calculated_price
    )
    db.add(db_ride)
    db.commit()
    db.refresh(db_ride)
    return db_ride


def get_all_rides(db: Session):
    return db.query(models.Ride).all()


def get_ride(db: Session, ride_id: int):
    ride = db.query(models.Ride).filter(models.Ride.ride_id == ride_id).first()
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


# ================= FARE SPLIT HELPER =================
def _recompute_fare_split(db: Session, ride: models.Ride):
    """Equal split of ride.price among all currently APPROVED bookings on this ride."""
    approved_bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.ride_id == ride.ride_id,
            models.Booking.status == models.BookingStatus.APPROVED
        )
        .all()
    )
    if not approved_bookings:
        return

    share = round(float(ride.price) / len(approved_bookings), 2)
    for b in approved_bookings:
        b.fare_share = share
    db.commit()


# ================= BOOKINGS =================
def create_booking(db: Session, booking: schemas.BookingCreate):
    ride = db.query(models.Ride).filter(models.Ride.ride_id == booking.ride_id).first()
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")

    passenger = db.query(models.User).filter(models.User.id == booking.passenger_id).first()
    if passenger is None:
        raise HTTPException(status_code=404, detail="Passenger not found")
    if passenger.role != models.UserRole.PASSENGER:
        raise HTTPException(status_code=400, detail="This user's role is not 'passenger'")

    if booking.seats_booked <= 0:
        raise HTTPException(status_code=400, detail="seats_booked must be greater than 0")

    if ride.available_seats < booking.seats_booked:
        raise HTTPException(status_code=400, detail="Not enough seats available")

    # Existing passengers whose approval is required (already approved on this ride)
    existing_approved = (
        db.query(models.Booking)
        .filter(
            models.Booking.ride_id == booking.ride_id,
            models.Booking.status == models.BookingStatus.APPROVED
        )
        .all()
    )

    initial_status = (
        models.BookingStatus.APPROVED if not existing_approved else models.BookingStatus.PENDING
    )

    db_booking = models.Booking(
        ride_id=booking.ride_id,
        passenger_id=booking.passenger_id,
        seats_booked=booking.seats_booked,
        status=initial_status
    )
    db.add(db_booking)

    # Reserve the seats immediately (whether pending or approved) so the ride can't be overbooked
    # while approvals are outstanding. Seats are released again on reject/cancel.
    ride.available_seats -= booking.seats_booked
    if ride.available_seats == 0:
        ride.status = "Full"

    db.commit()
    db.refresh(db_booking)
    db.refresh(ride)

    if initial_status == models.BookingStatus.PENDING:
        # Spawn one approval request per existing approved passenger
        for existing_booking in existing_approved:
            approval = models.BookingApproval(
                booking_id=db_booking.booking_id,
                approver_booking_id=existing_booking.booking_id,
                decision=models.ApprovalDecision.PENDING
            )
            db.add(approval)
        db.commit()
    else:
        # First passenger on the ride — approved immediately, gets 100% of fare for now
        _recompute_fare_split(db, ride)

    db.refresh(db_booking)
    return db_booking


def get_all_bookings(db: Session):
    return db.query(models.Booking).all()


def get_booking(db: Session, booking_id: int):
    booking = db.query(models.Booking).filter(models.Booking.booking_id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


def get_booking_approvals(db: Session, booking_id: int):
    get_booking(db, booking_id)  # 404 if missing
    return (
        db.query(models.BookingApproval)
        .filter(models.BookingApproval.booking_id == booking_id)
        .all()
    )


def _release_seats(ride: models.Ride, seats: int):
    ride.available_seats += seats
    if ride.available_seats > 0 and ride.status == "Full":
        ride.status = "available"


def decide_booking_approval(db: Session, booking_id: int, approver_booking_id: int, decision: str):
    """decision is 'approved' or 'rejected'."""
    booking = get_booking(db, booking_id)

    if booking.status != models.BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is no longer pending")

    approval = (
        db.query(models.BookingApproval)
        .filter(
            models.BookingApproval.booking_id == booking_id,
            models.BookingApproval.approver_booking_id == approver_booking_id
        )
        .first()
    )
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval request not found for this approver")

    approver_booking = db.query(models.Booking).filter(
        models.Booking.booking_id == approver_booking_id
    ).first()
    if approver_booking is None or approver_booking.status != models.BookingStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Approver is not an approved passenger on this ride")

    if approval.decision != models.ApprovalDecision.PENDING:
        raise HTTPException(status_code=400, detail="This approval has already been decided")

    approval.decision = models.ApprovalDecision.REJECTED if decision == "rejected" else models.ApprovalDecision.APPROVED
    approval.responded_at = datetime.utcnow()
    db.commit()

    ride = db.query(models.Ride).filter(models.Ride.ride_id == booking.ride_id).first()

    if approval.decision == models.ApprovalDecision.REJECTED:
        # One rejection is enough to reject the whole booking request
        booking.status = models.BookingStatus.REJECTED
        _release_seats(ride, booking.seats_booked)
        db.commit()
        db.refresh(booking)
        return booking

    # Check if every required approver has now approved
    all_approvals = (
        db.query(models.BookingApproval)
        .filter(models.BookingApproval.booking_id == booking_id)
        .all()
    )
    if all(a.decision == models.ApprovalDecision.APPROVED for a in all_approvals):
        booking.status = models.BookingStatus.APPROVED
        db.commit()
        _recompute_fare_split(db, ride)

    db.refresh(booking)
    return booking


# ================= PLACES =================
def create_place(db: Session, place: schemas.PlaceCreate):
    db_place = models.Place(place_name=place.place_name)
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place


def get_all_places(db: Session):
    return db.query(models.Place).all()


# ================= ROADS =================
def create_road(db: Session, road: schemas.RoadCreate):
    source = db.query(models.Place).filter(models.Place.place_id == road.source_place_id).first()
    destination = db.query(models.Place).filter(models.Place.place_id == road.destination_place_id).first()
    if source is None or destination is None:
        raise HTTPException(status_code=404, detail="Source or destination place not found")

    db_road = models.Road(
        source_place_id=road.source_place_id,
        destination_place_id=road.destination_place_id,
        distance=road.distance
    )
    db.add(db_road)
    db.commit()
    db.refresh(db_road)
    return db_road


def get_all_roads(db: Session):
    return db.query(models.Road).all()


# ================= DIJKSTRA =================
from .dijkstra import shortest_path

def find_shortest_path(db: Session, source_id: int, destination_id: int):
    places = db.query(models.Place).all()
    roads = db.query(models.Road).all()
    return shortest_path(places, roads, source_id, destination_id)