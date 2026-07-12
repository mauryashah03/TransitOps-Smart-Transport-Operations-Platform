import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, RequireRole
from app.models import Trip, Vehicle, Driver, VehicleStatus, DriverStatus, TripStatus, UserRole
from app.schemas import TripCreate, TripOut, TripCompleteRequest

router = APIRouter(prefix="/trips", tags=["Trips"])


def _generate_trip_code(db: Session) -> str:
    while True:
        code = "TR" + "".join(random.choices(string.digits, k=4))
        if not db.query(Trip).filter(Trip.trip_code == code).first():
            return code


@router.get("", response_model=list[TripOut])
def list_trips(
    status_filter: TripStatus | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Trip)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    return query.order_by(Trip.id.desc()).all()


@router.post("", response_model=TripOut, status_code=201)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER)),
):
    vehicle = db.query(Vehicle).get(payload.vehicle_id)
    driver = db.query(Driver).get(payload.driver_id)

    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # ---- Mandatory Business Rule Validations ----
    if vehicle.status in (VehicleStatus.RETIRED, VehicleStatus.IN_SHOP):
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle '{vehicle.registration_number}' is {vehicle.status.value} and cannot be dispatched",
        )
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(status_code=400, detail="Vehicle is already assigned to another trip")

    if driver.status == DriverStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Driver is suspended and cannot be assigned")
    if driver.is_license_expired():
        raise HTTPException(status_code=400, detail="Driver's license has expired")
    if driver.status == DriverStatus.ON_TRIP:
        raise HTTPException(status_code=400, detail="Driver is already assigned to another trip")

    if payload.cargo_weight_kg > vehicle.max_load_capacity_kg:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cargo weight {payload.cargo_weight_kg}kg exceeds vehicle capacity "
                f"{vehicle.max_load_capacity_kg}kg"
            ),
        )

    trip = Trip(
        trip_code=_generate_trip_code(db),
        source=payload.source,
        destination=payload.destination,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        cargo_weight_kg=payload.cargo_weight_kg,
        planned_distance_km=payload.planned_distance_km,
        status=TripStatus.DRAFT,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER)),
):
    trip = db.query(Trip).get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft trips can be dispatched")

    vehicle = db.query(Vehicle).get(trip.vehicle_id)
    driver = db.query(Driver).get(trip.driver_id)

    # Re-validate at dispatch time (state may have changed since draft creation)
    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Vehicle is no longer available")
    if driver.status != DriverStatus.AVAILABLE or driver.is_license_expired():
        raise HTTPException(status_code=400, detail="Driver is no longer available")

    # Business Rule: Dispatch automatically flips vehicle + driver to On Trip
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete_trip(
    trip_id: int,
    payload: TripCompleteRequest,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER)),
):
    trip = db.query(Trip).get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(status_code=400, detail="Only dispatched trips can be completed")

    vehicle = db.query(Vehicle).get(trip.vehicle_id)
    driver = db.query(Driver).get(trip.driver_id)

    trip.actual_distance_km = payload.actual_distance_km
    trip.fuel_consumed_liters = payload.fuel_consumed_liters
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()

    vehicle.odometer_km = (vehicle.odometer_km or 0) + payload.actual_distance_km
    # Business Rule: Completion restores availability
    vehicle.status = VehicleStatus.AVAILABLE
    driver.status = DriverStatus.AVAILABLE

    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER)),
):
    trip = db.query(Trip).get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        raise HTTPException(status_code=400, detail="Trip cannot be cancelled in its current state")

    was_dispatched = trip.status == TripStatus.DISPATCHED
    trip.status = TripStatus.CANCELLED

    if was_dispatched:
        # Business Rule: Cancelling a dispatched trip restores vehicle/driver to Available
        vehicle = db.query(Vehicle).get(trip.vehicle_id)
        driver = db.query(Driver).get(trip.driver_id)
        if vehicle and vehicle.status == VehicleStatus.ON_TRIP:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver and driver.status == DriverStatus.ON_TRIP:
            driver.status = DriverStatus.AVAILABLE

    db.commit()
    db.refresh(trip)
    return trip
