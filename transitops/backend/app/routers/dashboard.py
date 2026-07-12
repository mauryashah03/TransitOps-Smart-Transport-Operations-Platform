from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Vehicle, Driver, Trip, VehicleStatus, DriverStatus, TripStatus
from app.schemas import DashboardKPIs

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
def get_kpis(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_vehicles = db.query(Vehicle).filter(Vehicle.status != VehicleStatus.RETIRED).count()
    available_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).count()
    in_maintenance = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.IN_SHOP).count()
    on_trip_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.ON_TRIP).count()

    active_trips = db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()
    pending_trips = db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()

    drivers_on_duty = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()

    utilization = (on_trip_vehicles / total_vehicles * 100) if total_vehicles else 0.0

    return DashboardKPIs(
        active_vehicles=total_vehicles,
        available_vehicles=available_vehicles,
        vehicles_in_maintenance=in_maintenance,
        active_trips=active_trips,
        pending_trips=pending_trips,
        drivers_on_duty=drivers_on_duty,
        fleet_utilization_pct=round(utilization, 1),
    )
