from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/places",
    tags=["Places"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=schemas.PlaceResponse)
def create_place(
    place: schemas.PlaceCreate,
    db: Session = Depends(get_db)
):
    print("POST /places RECEIVED:", place.place_name)

    return crud.create_place(db, place)


@router.get("/", response_model=list[schemas.PlaceResponse])
def get_all_places(db: Session = Depends(get_db)):
    return crud.get_all_places(db)