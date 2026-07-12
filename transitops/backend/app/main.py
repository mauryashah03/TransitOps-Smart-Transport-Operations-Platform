from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine
from app.routers import auth, vehicles, drivers, trips, maintenance, fuel_expense, dashboard, analytics

# Create tables (for hackathon speed; use Alembic migrations in real production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Smart Transport Operations Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
app.include_router(drivers.router, prefix=settings.API_V1_PREFIX)
app.include_router(trips.router, prefix=settings.API_V1_PREFIX)
app.include_router(maintenance.router, prefix=settings.API_V1_PREFIX)
app.include_router(fuel_expense.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"service": settings.PROJECT_NAME, "status": "ok", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
