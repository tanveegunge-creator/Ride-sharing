from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import SessionLocal
 
router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)
 
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 
@router.post("/", response_model=schemas.BookingResponse)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db)
):
    return crud.create_booking(db, booking)
 
 
@router.get("/", response_model=list[schemas.BookingResponse])
def get_bookings(
    db: Session = Depends(get_db)
):
    return crud.get_all_bookings(db)
 
 
@router.get("/{booking_id}", response_model=schemas.BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    return crud.get_booking(db, booking_id)
 
 
@router.get("/{booking_id}/approvals", response_model=list[schemas.BookingApprovalResponse])
def get_booking_approvals(
    booking_id: int,
    db: Session = Depends(get_db)
):
    """Poll this to see which existing passengers have approved/rejected/are still pending."""
    return crud.get_booking_approvals(db, booking_id)
 
 
@router.post("/{booking_id}/approve", response_model=schemas.BookingResponse)
def approve_booking(
    booking_id: int,
    payload: schemas.ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    # NOTE: payload.approver_booking_id should really be derived from the authenticated
    # user's JWT + matched to their booking on this ride, not passed in the body.
    # Left explicit here to keep this runnable without wiring auth dependencies first.
    return crud.decide_booking_approval(db, booking_id, payload.approver_booking_id, "approved")
 
 
@router.post("/{booking_id}/reject", response_model=schemas.BookingResponse)
def reject_booking(
    booking_id: int,
    payload: schemas.ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    return crud.decide_booking_approval(db, booking_id, payload.approver_booking_id, "rejected")
