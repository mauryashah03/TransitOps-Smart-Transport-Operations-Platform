"""
Run with:  python -m app.seed
Seeds demo users (one per role), vehicles, drivers, and a couple of trips
so the app is immediately demoable for hackathon judges.
"""
from datetime import date, timedelta

from app.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models import (
    User, UserRole, Vehicle, VehicleStatus, Driver, DriverStatus, Trip, TripStatus,
    Maintenance, MaintenanceStatus, FuelLog, Expense,
)

Base.metadata.create_all(bind=engine)
db = SessionLocal()

DEMO_PASSWORD = "Password123!"


def get_or_create_user(email, name, role):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(full_name=name, email=email, hashed_password=hash_password(DEMO_PASSWORD), role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def seed():
    print("Seeding demo users...")
    get_or_create_user("manager@transitops.in", "Ravan K.", UserRole.FLEET_MANAGER)
    get_or_create_user("dispatcher@transitops.in", "Priya S.", UserRole.DRIVER)
    get_or_create_user("safety@transitops.in", "Suresh M.", UserRole.SAFETY_OFFICER)
    get_or_create_user("finance@transitops.in", "Anita R.", UserRole.FINANCIAL_ANALYST)

    print("Seeding vehicles...")
    if db.query(Vehicle).count() == 0:
        v1 = Vehicle(registration_number="GJ01AB1234", name_model="Van-05", type="Van",
                     max_load_capacity_kg=500, odometer_km=64200, acquisition_cost=620000,
                     status=VehicleStatus.AVAILABLE, region="Ahmedabad")
        v2 = Vehicle(registration_number="GJ01AB9981", name_model="Truck-11", type="Truck",
                     max_load_capacity_kg=5000, odometer_km=182000, acquisition_cost=2450000,
                     status=VehicleStatus.ON_TRIP, region="Ahmedabad")
        v3 = Vehicle(registration_number="GJ01AB1120", name_model="Mini-03", type="Mini",
                     max_load_capacity_kg=1000, odometer_km=66000, acquisition_cost=410000,
                     status=VehicleStatus.IN_SHOP, region="Surat")
        v4 = Vehicle(registration_number="GJ01AB0087", name_model="Van-09", type="Van",
                     max_load_capacity_kg=1500, odometer_km=214000, acquisition_cost=540000,
                     status=VehicleStatus.RETIRED, region="Surat")
        db.add_all([v1, v2, v3, v4])
        db.commit()

    print("Seeding drivers...")
    if db.query(Driver).count() == 0:
        d1 = Driver(name="Alex", license_number="DL-88215", license_category="LMV",
                    license_expiry=date.today() + timedelta(days=500),
                    contact_number="9876500000", safety_score=96, status=DriverStatus.AVAILABLE)
        d2 = Driver(name="John", license_number="DL-44120", license_category="HMV",
                    license_expiry=date.today() - timedelta(days=30),  # expired -> suspended-like
                    contact_number="9722000000", safety_score=81, status=DriverStatus.SUSPENDED)
        d3 = Driver(name="Priya", license_number="DL-77031", license_category="LMV",
                    license_expiry=date.today() + timedelta(days=200),
                    contact_number="9180000000", safety_score=99, status=DriverStatus.ON_TRIP)
        d4 = Driver(name="Suresh", license_number="DL-90045", license_category="HMV",
                    license_expiry=date.today() + timedelta(days=365),
                    contact_number="9440000000", safety_score=88, status=DriverStatus.OFF_DUTY)
        db.add_all([d1, d2, d3, d4])
        db.commit()

    print("Seeding a sample trip + maintenance + fuel log...")
    van05 = db.query(Vehicle).filter(Vehicle.registration_number == "GJ01AB1234").first()
    alex = db.query(Driver).filter(Driver.license_number == "DL-88215").first()

    if db.query(Trip).count() == 0 and van05 and alex:
        trip = Trip(trip_code="TR0001", source="Gandhinagar Depot", destination="Ahmedabad Hub",
                    vehicle_id=van05.id, driver_id=alex.id, cargo_weight_kg=450,
                    planned_distance_km=45, status=TripStatus.DRAFT)
        db.add(trip)
        db.commit()

    mini03 = db.query(Vehicle).filter(Vehicle.registration_number == "GJ01AB1120").first()
    if db.query(Maintenance).count() == 0 and mini03:
        db.add(Maintenance(vehicle_id=mini03.id, service_type="Tyre Replace", cost=6200,
                            service_date=date.today(), status=MaintenanceStatus.ACTIVE))
        db.commit()

    if db.query(FuelLog).count() == 0 and van05:
        db.add(FuelLog(vehicle_id=van05.id, liters=42, cost=3160, log_date=date.today()))
        db.commit()

    print("Done. Demo login credentials (password for all):", DEMO_PASSWORD)
    print(" - Fleet Manager:      manager@transitops.in")
    print(" - Dispatcher/Driver:  dispatcher@transitops.in")
    print(" - Safety Officer:     safety@transitops.in")
    print(" - Financial Analyst:  finance@transitops.in")


if __name__ == "__main__":
    seed()
