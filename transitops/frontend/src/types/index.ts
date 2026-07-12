export type UserRole = "fleet_manager" | "driver" | "safety_officer" | "financial_analyst";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";
export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";
export type MaintenanceStatus = "active" | "closed";

export interface Vehicle {
  id: number;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region?: string | null;
}

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  contact_number?: string | null;
  safety_score: number;
  status: DriverStatus;
}

export interface Trip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_id: number | null;
  driver_id: number | null;
  cargo_weight_kg: number;
  planned_distance_km: number;
  actual_distance_km: number | null;
  fuel_consumed_liters: number | null;
  status: TripStatus;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  service_type: string;
  cost: number;
  service_date: string;
  status: MaintenanceStatus;
  notes?: string | null;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  trip_id: number | null;
  liters: number;
  cost: number;
  log_date: string;
}

export interface Expense {
  id: number;
  vehicle_id: number;
  trip_id: number | null;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string | null;
}

export interface DashboardKPIs {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_pct: number;
}

export interface VehicleAnalytics {
  vehicle_id: number;
  registration_number: string;
  fuel_efficiency_km_per_l: number;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_operational_cost: number;
  revenue: number;
  roi_pct: number;
}
