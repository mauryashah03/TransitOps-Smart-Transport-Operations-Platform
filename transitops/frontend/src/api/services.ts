import { api } from "./client";
import type {
  User, Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, Expense,
  DashboardKPIs, VehicleAnalytics,
} from "../types";

export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string; user: User }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export const vehiclesApi = {
  list: (params?: Record<string, string | boolean>) =>
    api.get<Vehicle[]>("/vehicles", { params }).then((r) => r.data),
  get: (id: number) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (payload: Partial<Vehicle>) =>
    api.post<Vehicle>("/vehicles", payload).then((r) => r.data),
  update: (id: number, payload: Partial<Vehicle>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, payload).then((r) => r.data),
  retire: (id: number) => api.delete(`/vehicles/${id}`),
};

export const driversApi = {
  list: (params?: Record<string, string | boolean>) =>
    api.get<Driver[]>("/drivers", { params }).then((r) => r.data),
  create: (payload: Partial<Driver>) =>
    api.post<Driver>("/drivers", payload).then((r) => r.data),
  update: (id: number, payload: Partial<Driver>) =>
    api.patch<Driver>(`/drivers/${id}`, payload).then((r) => r.data),
};

export const tripsApi = {
  list: (status?: string) =>
    api.get<Trip[]>("/trips", { params: status ? { status_filter: status } : {} }).then((r) => r.data),
  create: (payload: {
    source: string; destination: string; vehicle_id: number; driver_id: number;
    cargo_weight_kg: number; planned_distance_km: number;
  }) => api.post<Trip>("/trips", payload).then((r) => r.data),
  dispatch: (id: number) => api.post<Trip>(`/trips/${id}/dispatch`).then((r) => r.data),
  complete: (id: number, payload: { actual_distance_km: number; fuel_consumed_liters: number }) =>
    api.post<Trip>(`/trips/${id}/complete`, payload).then((r) => r.data),
  cancel: (id: number) => api.post<Trip>(`/trips/${id}/cancel`).then((r) => r.data),
};

export const maintenanceApi = {
  list: () => api.get<MaintenanceRecord[]>("/maintenance").then((r) => r.data),
  create: (payload: {
    vehicle_id: number; service_type: string; cost: number; service_date: string; notes?: string;
  }) => api.post<MaintenanceRecord>("/maintenance", payload).then((r) => r.data),
  close: (id: number) => api.post<MaintenanceRecord>(`/maintenance/${id}/close`).then((r) => r.data),
};

export const fuelExpenseApi = {
  listFuelLogs: () => api.get<FuelLog[]>("/fuel-expenses/fuel-logs").then((r) => r.data),
  createFuelLog: (payload: { vehicle_id: number; trip_id?: number; liters: number; cost: number; log_date: string }) =>
    api.post<FuelLog>("/fuel-expenses/fuel-logs", payload).then((r) => r.data),
  listExpenses: () => api.get<Expense[]>("/fuel-expenses/expenses").then((r) => r.data),
  createExpense: (payload: { vehicle_id: number; trip_id?: number; category: string; amount: number; expense_date: string; notes?: string }) =>
    api.post<Expense>("/fuel-expenses/expenses", payload).then((r) => r.data),
};

export const dashboardApi = {
  kpis: () => api.get<DashboardKPIs>("/dashboard/kpis").then((r) => r.data),
};

export const analyticsApi = {
  vehicles: () => api.get<VehicleAnalytics[]>("/analytics/vehicles").then((r) => r.data),
  fleetHealth: () =>
    api.get<{ vehicle_id: number; registration_number: string; health_score: number }[]>(
      "/analytics/fleet-health-score"
    ).then((r) => r.data),
};
