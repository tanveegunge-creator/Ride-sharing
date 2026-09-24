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