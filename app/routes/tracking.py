from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List

from .. import crud, schemas
from ..database import SessionLocal

router = APIRouter(
    prefix="/rides",
    tags=["Tracking"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================= REST: last-known location =================
@router.put("/{ride_id}/location", response_model=schemas.RideLocationResponse)
async def update_ride_location(
    ride_id: int,
    location: schemas.RideLocationUpdate,
    db: Session = Depends(get_db)
):
    row = crud.update_ride_location(db, ride_id, location)
    await manager.broadcast_location(ride_id, {
        "ride_id": ride_id,
        "latitude": row.latitude,
        "longitude": row.longitude,
    })
    return row


@router.get("/{ride_id}/location", response_model=schemas.RideLocationResponse)
def get_ride_location(
    ride_id: int,
    db: Session = Depends(get_db)
):
    """Fallback / initial load — poll this if you don't want to bother with the WebSocket."""
    return crud.get_ride_location(db, ride_id)


# ================= WEBSOCKET: live push =================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, ride_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(ride_id, []).append(websocket)

    def disconnect(self, ride_id: int, websocket: WebSocket):
        conns = self.active_connections.get(ride_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if ride_id in self.active_connections and not self.active_connections[ride_id]:
            del self.active_connections[ride_id]

    async def broadcast_location(self, ride_id: int, data: dict):
        for connection in self.active_connections.get(ride_id, []):
            await connection.send_json(data)


manager = ConnectionManager()


@router.websocket("/ws/{ride_id}/track")
async def ride_tracking_socket(websocket: WebSocket, ride_id: int):
    await manager.connect(ride_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ride_id, websocket)
