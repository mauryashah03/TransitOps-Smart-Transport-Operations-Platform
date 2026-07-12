import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Boolean,
    ForeignKey, Enum as SAEnum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    FLEET_MANAGER = "fleet_manager"
    DRIVER = "driver"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    IN_SHOP = "in_shop"
    RETIRED = "retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "draft"
    DISPATCHED = "dispatched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, index=True, nullable=False)
    name_model = Column(String(120), nullable=False)
    type = Column(String(50), nullable=False)  # Van, Truck, Mini, etc.
    max_load_capacity_kg = Column(Float, nullable=False)
    odometer_km = Column(Float, default=0)
    acquisition_cost = Column(Float, default=0)
    status = Column(SAEnum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False)
    region = Column(String(80), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_records = relationship("Maintenance", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    license_number = Column(String(50), unique=True, index=True, nullable=False)
    license_category = Column(String(20), nullable=False)
    license_expiry = Column(Date, nullable=False)
    contact_number = Column(String(20), nullable=True)
    safety_score = Column(Integer, default=100)
    status = Column(SAEnum(DriverStatus), default=DriverStatus.AVAILABLE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="driver")

    def is_license_expired(self) -> bool:
        return self.license_expiry < date.today()


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    trip_code = Column(String(20), unique=True, index=True, nullable=False)
    source = Column(String(120), nullable=False)
    destination = Column(String(120), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    cargo_weight_kg = Column(Float, nullable=False)
    planned_distance_km = Column(Float, nullable=False)
    actual_distance_km = Column(Float, nullable=True)
    fuel_consumed_liters = Column(Float, nullable=True)
    status = Column(SAEnum(TripStatus), default=TripStatus.DRAFT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")


# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------

class Maintenance(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String(120), nullable=False)
    cost = Column(Float, default=0)
    service_date = Column(Date, nullable=False)
    status = Column(SAEnum(MaintenanceStatus), default=MaintenanceStatus.ACTIVE, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_records")


# ---------------------------------------------------------------------------
# Fuel Logs
# ---------------------------------------------------------------------------

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    log_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


# ---------------------------------------------------------------------------
# Expenses (tolls, misc, maintenance-linked)
# ---------------------------------------------------------------------------

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    category = Column(String(50), nullable=False)  # toll, misc, other
    amount = Column(Float, nullable=False)
    expense_date = Column(Date, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="expenses")
