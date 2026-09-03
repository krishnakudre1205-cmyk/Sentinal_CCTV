from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.watchlist import WatchlistResponse, WatchlistCreate
from app.models.watchlist import WatchlistItem
from app.services.alert_engine import seed_default_watchlist_if_empty

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


@router.get("/", response_model=List[WatchlistResponse])
def list_watchlist(db: Session = Depends(get_db)):
    """
    Retrieve all active law enforcement watchlist items.
    """
    seed_default_watchlist_if_empty(db)
    items = db.query(WatchlistItem).order_by(WatchlistItem.id.asc()).all()
    return items


@router.post("/", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
def create_watchlist_target(payload: WatchlistCreate, db: Session = Depends(get_db)):
    """
    Add a target vehicle to the active police watchlist.
    """
    data = payload.model_dump()
    if not data.get("plate_number") and data.get("license_plate"):
        data["plate_number"] = data["license_plate"]
    if not data.get("license_plate") and data.get("plate_number"):
        data["license_plate"] = data["plate_number"]

    new_item = WatchlistItem(**data)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.get("/{target_id}", response_model=WatchlistResponse)
def get_watchlist_target(target_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific watchlist target by ID.
    """
    item = db.query(WatchlistItem).filter(WatchlistItem.id == target_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target not found in watchlist")
    return item
