from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, RequireRole
from app.models import Maintenance, Vehicle, VehicleStatus, MaintenanceStatus, UserRole
from app.schemas import MaintenanceCreate, MaintenanceOut

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("", response_model=list[MaintenanceOut])
def list_maintenance(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Maintenance).order_by(Maintenance.id.desc()).all()


@router.post("", response_model=MaintenanceOut, status_code=201)
def create_maintenance(
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER)),
):
    vehicle = db.query(Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(
            status_code=400, detail="Cannot log maintenance for a vehicle currently on trip"
        )
    if vehicle.status == VehicleStatus.RETIRED:
        raise HTTPException(status_code=400, detail="Cannot log maintenance for a retired vehicle")

    record = Maintenance(**payload.model_dump(), status=MaintenanceStatus.ACTIVE)
    db.add(record)

    # Business Rule: Creating an active maintenance record -> vehicle becomes In Shop,
    # automatically removing it from the dispatch pool.
    vehicle.status = VehicleStatus.IN_SHOP

    db.commit()
    db.refresh(record)
    return record


@router.post("/{maintenance_id}/close", response_model=MaintenanceOut)
def close_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER)),
):
    record = db.query(Maintenance).get(maintenance_id)
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    if record.status == MaintenanceStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Maintenance record already closed")

    record.status = MaintenanceStatus.CLOSED
    record.closed_at = datetime.utcnow()

    vehicle = db.query(Vehicle).get(record.vehicle_id)
    # Business Rule: Closing maintenance restores vehicle to Available, unless retired,
    # and unless other active maintenance records still exist for the same vehicle.
    other_active = (
        db.query(Maintenance)
        .filter(
            Maintenance.vehicle_id == vehicle.id,
            Maintenance.status == MaintenanceStatus.ACTIVE,
            Maintenance.id != record.id,
        )
        .first()
    )
    if vehicle.status != VehicleStatus.RETIRED and not other_active:
        vehicle.status = VehicleStatus.AVAILABLE

    db.commit()
    db.refresh(record)
    return record
