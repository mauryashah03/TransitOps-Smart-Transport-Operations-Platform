from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, RequireRole
from app.models import Vehicle, VehicleStatus, UserRole
from app.schemas import VehicleCreate, VehicleUpdate, VehicleOut

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    status_filter: Optional[VehicleStatus] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    region: Optional[str] = None,
    search: Optional[str] = None,
    dispatch_pool_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Vehicle)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if type_filter:
        query = query.filter(Vehicle.type == type_filter)
    if region:
        query = query.filter(Vehicle.region == region)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Vehicle.registration_number.ilike(like)) | (Vehicle.name_model.ilike(like))
        )
    # Business Rule: Retired / In Shop vehicles must NEVER appear in dispatch pool.
    if dispatch_pool_only:
        query = query.filter(Vehicle.status == VehicleStatus.AVAILABLE)
    return query.order_by(Vehicle.id.desc()).all()


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER)),
):
    # Business Rule: registration number must be unique
    existing = db.query(Vehicle).filter(
        Vehicle.registration_number == payload.registration_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Registration number must be unique")

    vehicle = Vehicle(**payload.model_dump(), status=VehicleStatus.AVAILABLE)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicle = db.query(Vehicle).get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER)),
):
    vehicle = db.query(Vehicle).get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
def retire_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER)),
):
    """Soft-delete: vehicles are retired, never hard-deleted (audit integrity)."""
    vehicle = db.query(Vehicle).get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(status_code=400, detail="Cannot retire a vehicle that is on a trip")
    vehicle.status = VehicleStatus.RETIRED
    db.commit()
    return None
