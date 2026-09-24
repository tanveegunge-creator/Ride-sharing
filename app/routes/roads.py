from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/roads",
    tags=["Roads"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create Road
@router.post("/", response_model=schemas.RoadResponse)
def create_road(
    road: schemas.RoadCreate,
    db: Session = Depends(get_db)
):
    return crud.create_road(db, road)


# Get All Roads
@router.get("/", response_model=list[schemas.RoadResponse])
def get_all_roads(
    db: Session = Depends(get_db)
):
    return crud.get_all_roads(db)

@router.get("/shortest-path/")
def shortest_path(
    source: int,
    destination: int,
    db: Session = Depends(get_db)
):
    return crud.find_shortest_path(
        db,
        source,
        destination
    )