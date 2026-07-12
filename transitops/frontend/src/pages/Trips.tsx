import { useEffect, useState } from "react";
import { tripsApi, vehiclesApi, driversApi } from "../api/services";
import type { Trip, Vehicle, Driver } from "../types";
import StatusBadge from "../components/StatusBadge";

const EMPTY_FORM = {
  source: "", destination: "", vehicle_id: "", driver_id: "",
  cargo_weight_kg: "", planned_distance_km: "",
};

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [completingTrip, setCompletingTrip] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState({ actual_distance_km: "", fuel_consumed_liters: "" });

  async function load() {
    const [t, v, d] = await Promise.all([
      tripsApi.list(),
      vehiclesApi.list({ dispatch_pool_only: true }),
      driversApi.list({ dispatch_pool_only: true }),
    ]);
    setTrips(t);
    setAvailableVehicles(v);
    setAvailableDrivers(d);
  }

  useEffect(() => { load(); }, []);

  const selectedVehicle = availableVehicles.find((v) => v.id === Number(form.vehicle_id));
  const cargoExceeds =
    selectedVehicle && form.cargo_weight_kg
      ? Number(form.cargo_weight_kg) > selectedVehicle.max_load_capacity_kg
      : false;

  async function handleCreate() {
    setError(null);
    try {
      await tripsApi.create({
        source: form.source,
        destination: form.destination,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight_kg: Number(form.cargo_weight_kg),
        planned_distance_km: Number(form.planned_distance_km),
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to create trip");
    }
  }

  async function handleDispatch(id: number) {
    setError(null);
    try {
      await tripsApi.dispatch(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to dispatch trip");
    }
  }

  async function handleCancel(id: number) {
    setError(null);
    try {
      await tripsApi.cancel(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to cancel trip");
    }
  }

  async function handleComplete() {
    if (!completingTrip) return;
    setError(null);
    try {
      await tripsApi.complete(completingTrip.id, {
        actual_distance_km: Number(completeForm.actual_distance_km),
        fuel_consumed_liters: Number(completeForm.fuel_consumed_liters),
      });
      setCompletingTrip(null);
      setCompleteForm({ actual_distance_km: "", fuel_consumed_liters: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to complete trip");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-4 lg:col-span-2">
        <div className="text-sm font-medium mb-3">Live Board</div>
        <div className="space-y-2">
          {trips.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--bg-panel-alt)" }}>
              <div>
                <div className="text-[13px] font-medium">{t.trip_code}</div>
                <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {t.source} &rarr; {t.destination}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} />
                {t.status === "draft" && (
                  <>
                    <button className="btn-primary" onClick={() => handleDispatch(t.id)}>Dispatch</button>
                    <button className="btn-ghost" onClick={() => handleCancel(t.id)}>Cancel</button>
                  </>
                )}
                {t.status === "dispatched" && (
                  <>
                    <button className="btn-primary" onClick={() => setCompletingTrip(t)}>Complete</button>
                    <button className="btn-ghost" onClick={() => handleCancel(t.id)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {trips.length === 0 && (
            <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>No trips yet.</div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-medium mb-3">Create Trip</div>
        {error && (
          <div className="text-[12px] mb-3 px-3 py-2 rounded-md" style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a" }}>
            {error}
          </div>
        )}
        <div className="space-y-3">
          <input className="input-field w-full" placeholder="Source"
            value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <input className="input-field w-full" placeholder="Destination"
            value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <select className="input-field w-full" value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
            <option value="">Vehicle (available only)</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name_model} &mdash; {v.max_load_capacity_kg}kg capacity</option>
            ))}
          </select>
          <select className="input-field w-full" value={form.driver_id}
            onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
            <option value="">Driver (available only)</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input className="input-field w-full" placeholder="Cargo Weight (kg)" type="number"
            value={form.cargo_weight_kg} onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })} />
          <input className="input-field w-full" placeholder="Planned Distance (km)" type="number"
            value={form.planned_distance_km} onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })} />

          {selectedVehicle && form.cargo_weight_kg && (
            <div
              className="text-[12px] px-3 py-2 rounded-md"
              style={{
                background: cargoExceeds ? "rgba(230,90,90,0.1)" : "rgba(62,201,122,0.1)",
                color: cargoExceeds ? "#e65a5a" : "#3ec97a",
              }}
            >
              Vehicle Capacity {selectedVehicle.max_load_capacity_kg} kg &middot; Cargo Weight {form.cargo_weight_kg} kg
              {cargoExceeds && <div>&#10007; Capacity exceeded &mdash; dispatch will be blocked</div>}
            </div>
          )}

          <button
            className="btn-primary w-full"
            disabled={!form.source || !form.destination || !form.vehicle_id || !form.driver_id || cargoExceeds}
            onClick={handleCreate}
          >
            Create Trip (Draft)
          </button>
        </div>
      </div>

      {completingTrip && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card p-5 w-full max-w-sm">
            <div className="text-sm font-medium mb-4">Complete Trip {completingTrip.trip_code}</div>
            <div className="space-y-3">
              <input className="input-field w-full" placeholder="Final Odometer Distance (km)" type="number"
                value={completeForm.actual_distance_km}
                onChange={(e) => setCompleteForm({ ...completeForm, actual_distance_km: e.target.value })} />
              <input className="input-field w-full" placeholder="Fuel Consumed (liters)" type="number"
                value={completeForm.fuel_consumed_liters}
                onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed_liters: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setCompletingTrip(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleComplete}>Mark Completed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
