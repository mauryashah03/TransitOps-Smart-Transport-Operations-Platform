import { useEffect, useState } from "react";
import { maintenanceApi, vehiclesApi } from "../api/services";
import type { MaintenanceRecord, Vehicle } from "../types";
import StatusBadge from "../components/StatusBadge";

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicle_id: "", service_type: "", cost: "", service_date: "", notes: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [r, v] = await Promise.all([maintenanceApi.list(), vehiclesApi.list()]);
    setRecords(r);
    setVehicles(v);
  }

  useEffect(() => { load(); }, []);

  function vehicleReg(id: number) {
    return vehicles.find((v) => v.id === id)?.registration_number ?? `#${id}`;
  }

  async function handleCreate() {
    setError(null);
    try {
      await maintenanceApi.create({
        vehicle_id: Number(form.vehicle_id),
        service_type: form.service_type,
        cost: Number(form.cost || 0),
        service_date: form.service_date,
        notes: form.notes || undefined,
      });
      setForm({ vehicle_id: "", service_type: "", cost: "", service_date: "", notes: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to create maintenance record");
    }
  }

  async function handleClose(id: number) {
    setError(null);
    try {
      await maintenanceApi.close(id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to close maintenance record");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="text-sm font-medium mb-3">Log Service Record</div>
        {error && (
          <div className="text-[12px] mb-3 px-3 py-2 rounded-md" style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a" }}>
            {error}
          </div>
        )}
        <div className="space-y-3">
          <select className="input-field w-full" value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
            <option value="">Select vehicle</option>
            {vehicles.filter(v => v.status !== "retired").map((v) => (
              <option key={v.id} value={v.id}>{v.registration_number} &mdash; {v.name_model}</option>
            ))}
          </select>
          <input className="input-field w-full" placeholder="Service Type (e.g. Oil Change)"
            value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} />
          <input className="input-field w-full" placeholder="Cost" type="number"
            value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <input className="input-field w-full" type="date"
            value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} />
          <textarea className="input-field w-full" placeholder="Notes"
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary w-full" onClick={handleCreate}
            disabled={!form.vehicle_id || !form.service_type || !form.service_date}>
            Save
          </button>
        </div>
        <div className="text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>
          Adding a record automatically switches vehicle status to In Shop, removing it from dispatch.
        </div>
      </div>

      <div className="card p-4 lg:col-span-2 overflow-x-auto">
        <div className="text-sm font-medium mb-3">Service Log</div>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-3 py-2 font-normal">Vehicle</th>
              <th className="px-3 py-2 font-normal">Service Type</th>
              <th className="px-3 py-2 font-normal">Cost</th>
              <th className="px-3 py-2 font-normal">Date</th>
              <th className="px-3 py-2 font-normal">Status</th>
              <th className="px-3 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-3 py-2 font-medium">{vehicleReg(r.vehicle_id)}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{r.service_type}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>&#8377;{r.cost.toLocaleString()}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{r.service_date}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2">
                  {r.status === "active" && (
                    <button className="btn-ghost" onClick={() => handleClose(r.id)}>Close</button>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center" style={{ color: "var(--text-muted)" }}>No maintenance records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
