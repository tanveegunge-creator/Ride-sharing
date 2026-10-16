from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/rides",
    tags=["Rides"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.RideResponse)
def create_ride(
    ride: schemas.RideCreate,
    db: Session = Depends(get_db)
):
    return crud.create_ride(db, ride)


@router.get("/", response_model=list[schemas.RideResponse])
def get_all_rides(
    db: Session = Depends(get_db)
):
    return crud.get_all_rides(db)


@router.get("/{ride_id}", response_model=schemas.RideResponse)
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db)
):
    return crud.get_ride(db, ride_id)


@router.post("/{ride_id}/start", response_model=schemas.RideResponse)
def start_ride(
    ride_id: int,
    payload: schemas.StartRideRequest,
    db: Session = Depends(get_db)
):
    return crud.start_ride(db, ride_id, payload.driver_id)


@router.post("/{ride_id}/end", response_model=schemas.RideResponse)
def end_ride(
    ride_id: int,
    payload: schemas.EndRideRequest,
    db: Session = Depends(get_db)
):
    """stopped_place_id = null -> ride completed; any on-route place -> stopped midway."""
    return crud.end_ride(db, ride_id, payload.driver_id, payload.stopped_place_id)


@router.get("/{ride_id}/bookings", response_model=list[schemas.RideBookingResponse])
def get_ride_bookings(
    ride_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Driver-only: passengers, fares and payment status for this ride."""
    return crud.list_ride_bookings(db, ride_id, driver_id)
