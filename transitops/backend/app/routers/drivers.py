from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, RequireRole
from app.models import Driver, DriverStatus, UserRole
from app.schemas import DriverCreate, DriverUpdate, DriverOut

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("", response_model=list[DriverOut])
def list_drivers(
    status_filter: Optional[DriverStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    dispatch_pool_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.status == status_filter)
    if search:
        like = f"%{search}%"
        query = query.filter((Driver.name.ilike(like)) | (Driver.license_number.ilike(like)))
    if dispatch_pool_only:
        # Business Rule: expired license / suspended drivers excluded from dispatch pool
        query = query.filter(Driver.status == DriverStatus.AVAILABLE)
    drivers = query.order_by(Driver.id.desc()).all()
    if dispatch_pool_only:
        drivers = [d for d in drivers if not d.is_license_expired()]
    return drivers


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER)),
):
    existing = db.query(Driver).filter(Driver.license_number == payload.license_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="License number must be unique")

    driver = Driver(**payload.model_dump(), status=DriverStatus.AVAILABLE)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    driver = db.query(Driver).get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER)),
):
    driver = db.query(Driver).get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver
