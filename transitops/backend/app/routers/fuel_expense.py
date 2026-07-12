from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, RequireRole
from app.models import FuelLog, Expense, Vehicle, UserRole
from app.schemas import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/fuel-expenses", tags=["Fuel & Expenses"])


@router.get("/fuel-logs", response_model=list[FuelLogOut])
def list_fuel_logs(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(FuelLog).order_by(FuelLog.id.desc()).all()


@router.post("/fuel-logs", response_model=FuelLogOut, status_code=201)
def create_fuel_log(
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST)),
):
    vehicle = db.query(Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    log = FuelLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Expense).order_by(Expense.id.desc()).all()


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    _=Depends(RequireRole(UserRole.DRIVER, UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST)),
):
    vehicle = db.query(Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
