import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { vehiclesApi } from "../api/services";
import type { Vehicle } from "../types";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  registration_number: "",
  name_model: "",
  type: "Van",
  max_load_capacity_kg: "",
  odometer_km: "0",
  acquisition_cost: "",
  region: "",
};

export default function Fleet() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canManage = user?.role === "fleet_manager";

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await vehiclesApi.list(params);
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleCreate() {
    setError(null);
    try {
      await vehiclesApi.create({
        registration_number: form.registration_number,
        name_model: form.name_model,
        type: form.type,
        max_load_capacity_kg: Number(form.max_load_capacity_kg),
        odometer_km: Number(form.odometer_km),
        acquisition_cost: Number(form.acquisition_cost),
        region: form.region || undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to create vehicle");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Search reg. no or model..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
          <button className="btn-ghost" onClick={load}>Apply</button>
        </div>
        {canManage && (
          <button className="btn-primary flex items-center gap-1" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-4 py-3 font-normal">Reg. No.</th>
              <th className="px-4 py-3 font-normal">Name/Model</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Capacity</th>
              <th className="px-4 py-3 font-normal">Odometer</th>
              <th className="px-4 py-3 font-normal">Acq. Cost</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-4 py-3 font-medium">{v.registration_number}</td>
                <td className="px-4 py-3">{v.name_model}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{v.type}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{v.max_load_capacity_kg} kg</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{v.odometer_km.toLocaleString()} km</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                  &#8377;{v.acquisition_cost.toLocaleString()}
                </td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
              </tr>
            ))}
            {!loading && vehicles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center" style={{ color: "var(--text-muted)" }}>
                  No vehicles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Rule: Registration No. must be unique &middot; Retired/In-Shop vehicles are hidden from Trip Dispatcher.
      </div>

      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div className="card p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium">Add Vehicle</div>
              <button onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {error && (
              <div className="text-[12px] mb-3 px-3 py-2 rounded-md" style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a" }}>
                {error}
              </div>
            )}
            <div className="space-y-3">
              <input className="input-field w-full" placeholder="Registration Number"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
              <input className="input-field w-full" placeholder="Name / Model"
                value={form.name_model}
                onChange={(e) => setForm({ ...form, name_model: e.target.value })} />
              <select className="input-field w-full" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Van</option><option>Truck</option><option>Mini</option>
              </select>
              <input className="input-field w-full" placeholder="Max Load Capacity (kg)" type="number"
                value={form.max_load_capacity_kg}
                onChange={(e) => setForm({ ...form, max_load_capacity_kg: e.target.value })} />
              <input className="input-field w-full" placeholder="Acquisition Cost" type="number"
                value={form.acquisition_cost}
                onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} />
              <input className="input-field w-full" placeholder="Region"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Save Vehicle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
