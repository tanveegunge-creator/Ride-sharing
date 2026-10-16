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
    # NOTE: approver_booking_id should really come from the authenticated user's JWT.
    return crud.decide_booking_approval(db, booking_id, payload.approver_booking_id, "approved")


@router.post("/{booking_id}/reject", response_model=schemas.BookingResponse)
def reject_booking(
    booking_id: int,
    payload: schemas.ApprovalDecisionRequest,
    db: Session = Depends(get_db)
):
    return crud.decide_booking_approval(db, booking_id, payload.approver_booking_id, "rejected")


# ================= PAYMENTS =================
@router.post("/{booking_id}/pay", response_model=schemas.BookingResponse)
def pay_booking(
    booking_id: int,
    payload: schemas.PayRequest,
    db: Session = Depends(get_db)
):
    """Passenger picks cash or online after the ride has ended."""
    return crud.pay_booking(db, booking_id, payload.passenger_id, payload.method)


@router.get("/{booking_id}/payment-info", response_model=schemas.PaymentInfo)
def get_payment_info(
    booking_id: int,
    passenger_id: int,
    db: Session = Depends(get_db)
):
    """UPI link for the QR code (online payments)."""
    return crud.get_payment_info(db, booking_id, passenger_id)


@router.post("/{booking_id}/confirm-payment", response_model=schemas.BookingResponse)
def confirm_payment(
    booking_id: int,
    payload: schemas.ConfirmPaymentRequest,
    db: Session = Depends(get_db)
):
    """Driver confirms the cash/online payment was received."""
    return crud.confirm_payment(db, booking_id, payload.driver_id)
