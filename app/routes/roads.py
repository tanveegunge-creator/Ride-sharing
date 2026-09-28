from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db  # change this import if your get_db lives elsewhere

router = APIRouter(prefix="/places", tags=["Places"])


@router.get("/", response_model=list[schemas.PlaceOut])
def list_places(db: Session = Depends(get_db)):
    return db.query(models.Place).order_by(models.Place.place_id).all()


@router.post("/", response_model=schemas.PlaceOut)
def create_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.Place)
        .filter(models.Place.place_name == place.place_name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Place already exists")

    new_place = models.Place(
        place_name=place.place_name,
        latitude=place.latitude,
        longitude=place.longitude,
    )
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place


@router.patch("/{place_id}/location", response_model=schemas.PlaceOut)
def update_place_location(
    place_id: int,
    location: schemas.PlaceLocationUpdate,
    db: Session = Depends(get_db),
):
    place = (
        db.query(models.Place).filter(models.Place.place_id == place_id).first()
    )
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    place.latitude = location.latitude
    place.longitude = location.longitude
    db.commit()
    db.refresh(place)
    return place
