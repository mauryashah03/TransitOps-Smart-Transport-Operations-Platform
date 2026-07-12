# 🚛 TransitOps Pro — Smart Transport Operations Platform

Enterprise fleet & transport operations platform built for the Odoo Hackathon.
FastAPI + SQLAlchemy backend, React 19 + TypeScript + Tailwind frontend.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2, JWT auth, SQLite (dev) / Postgres-ready
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios, Recharts, lucide-react

## Project Structure

```
transitops/
├── backend/
│   ├── app/
│   │   ├── core/           # config, security (JWT/hashing)
│   │   ├── routers/        # API endpoints per domain
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── deps.py         # auth dependency + RBAC role checker
│   │   ├── database.py     # engine/session
│   │   ├── seed.py         # demo data seeder
│   │   └── main.py         # FastAPI app entrypoint
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/             # axios client + service functions
    │   ├── components/      # Sidebar, Topbar, Layout, StatusBadge, etc.
    │   ├── context/          # AuthContext
    │   ├── pages/            # Login, Dashboard, Fleet, Drivers, Trips,
    │   │                       Maintenance, FuelExpenses, Analytics, Settings
    │   └── types/            # shared TS types
    └── package.json
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed               # seeds demo users, vehicles, drivers, a sample trip
uvicorn app.main:app --reload    # runs on http://localhost:8000
```

Swagger docs: **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                      # runs on http://localhost:5173
```

### Demo Logins (password for all: `Password123!`)

| Role               | Email                       |
|--------------------|------------------------------|
| Fleet Manager      | manager@transitops.in       |
| Dispatcher/Driver   | dispatcher@transitops.in    |
| Safety Officer      | safety@transitops.in        |
| Financial Analyst   | finance@transitops.in       |

## Mandatory Business Rules (enforced server-side in `app/routers/trips.py`, `maintenance.py`, `vehicles.py`)

- Vehicle registration number is unique (DB constraint + explicit check).
- Retired / In-Shop vehicles never appear in the dispatch pool (`?dispatch_pool_only=true`).
- Drivers with expired licenses or Suspended status are excluded from dispatch and rejected server-side even if the client is bypassed.
- A vehicle/driver already On Trip cannot be assigned to a second trip.
- Cargo weight is validated against vehicle max load capacity before a trip can be created.
- Dispatch atomically flips vehicle + driver to `On Trip`.
- Completing a trip restores both to `Available` and updates the vehicle odometer.
- Cancelling a dispatched trip restores vehicle + driver to `Available`.
- Creating an active maintenance record flips the vehicle to `In Shop`.
- Closing maintenance restores the vehicle to `Available` (unless retired or another active record exists).

## API Overview

All endpoints are prefixed `/api/v1` and require a Bearer JWT (obtained from `/auth/login`) except `/auth/register` and `/auth/login`.

- `POST /auth/register`, `POST /auth/login`
- `GET/POST/PATCH/DELETE /vehicles`
- `GET/POST/PATCH /drivers`
- `GET/POST /trips`, `POST /trips/{id}/dispatch|complete|cancel`
- `GET/POST /maintenance`, `POST /maintenance/{id}/close`
- `GET/POST /fuel-expenses/fuel-logs`, `GET/POST /fuel-expenses/expenses`
- `GET /dashboard/kpis`
- `GET /analytics/vehicles`, `GET /analytics/fleet-health-score`

## Notes for Judges

- Business logic lives entirely in the router/service layer server-side — the frontend UI restrictions (e.g. hiding unavailable vehicles from dropdowns) are a UX convenience, not the source of truth. Every rule is re-validated on the backend even if bypassed.
- RBAC is enforced via a `RequireRole` FastAPI dependency per endpoint.
- SQLite is used for zero-setup demo; `DATABASE_URL` in `.env` can point to Postgres with no code changes (SQLAlchemy is dialect-agnostic here).
