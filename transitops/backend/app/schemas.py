from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models import UserRole, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus


# ---------------------------------------------------------------------------
# Auth / Users
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------------
# Vehicle
# ---------------------------------------------------------------------------

class VehicleCreate(BaseModel):
    registration_number: str
    name_model: str
    type: str
    max_load_capacity_kg: float
    odometer_km: float = 0
    acquisition_cost: float = 0
    region: Optional[str] = None


class VehicleUpdate(BaseModel):
    name_model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity_kg: Optional[float] = None
    odometer_km: Optional[float] = None
    acquisition_cost: Optional[float] = None
    status: Optional[VehicleStatus] = None
    region: Optional[str] = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    registration_number: str
    name_model: str
    type: str
    max_load_capacity_kg: float
    odometer_km: float
    acquisition_cost: float
    status: VehicleStatus
    region: Optional[str] = None


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: Optional[str] = None
    safety_score: int = 100


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[int] = None
    status: Optional[DriverStatus] = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: Optional[str] = None
    safety_score: int
    status: DriverStatus


# ---------------------------------------------------------------------------
# Trip
# ---------------------------------------------------------------------------

class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    planned_distance_km: float


class TripCompleteRequest(BaseModel):
    actual_distance_km: float
    fuel_consumed_liters: float


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trip_code: str
    source: str
    destination: str
    vehicle_id: Optional[int]
    driver_id: Optional[int]
    cargo_weight_kg: float
    planned_distance_km: float
    actual_distance_km: Optional[float] = None
    fuel_consumed_liters: Optional[float] = None
    status: TripStatus
    created_at: datetime
    dispatched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str
    cost: float = 0
    service_date: date
    notes: Optional[str] = None


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    service_type: str
    cost: float
    service_date: date
    status: MaintenanceStatus
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Fuel & Expense
# ---------------------------------------------------------------------------

class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    log_date: date


class FuelLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    log_date: date


class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    category: str
    amount: float
    expense_date: date
    notes: Optional[str] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    trip_id: Optional[int] = None
    category: str
    amount: float
    expense_date: date
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Dashboard / Analytics
# ---------------------------------------------------------------------------

class DashboardKPIs(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_pct: float


class VehicleAnalytics(BaseModel):
    vehicle_id: int
    registration_number: str
    fuel_efficiency_km_per_l: float
    total_fuel_cost: float
    total_maintenance_cost: float
    total_operational_cost: float
    revenue: float
    roi_pct: float
