import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { driversApi } from "../api/services";
import type { Driver } from "../types";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "", license_number: "", license_category: "LMV", license_expiry: "",
  contact_number: "", safety_score: "100",
};

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === "fleet_manager" || user?.role === "safety_officer";

  async function load() {
    setLoading(true);
    try {
      setDrivers(await driversApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function isExpired(dateStr: string) {
    return new Date(dateStr) < new Date();
  }

  async function handleCreate() {
    setError(null);
    try {
      await driversApi.create({
        name: form.name,
        license_number: form.license_number,
        license_category: form.license_category,
        license_expiry: form.license_expiry,
        contact_number: form.contact_number || undefined,
        safety_score: Number(form.safety_score),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to create driver");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Drivers & Safety Profiles</div>
        {canManage && (
          <button className="btn-primary flex items-center gap-1" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Driver
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-4 py-3 font-normal">Driver</th>
              <th className="px-4 py-3 font-normal">License No.</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Expiry</th>
              <th className="px-4 py-3 font-normal">Contact</th>
              <th className="px-4 py-3 font-normal">Safety</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{d.license_number}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{d.license_category}</td>
                <td className="px-4 py-3" style={{ color: isExpired(d.license_expiry) ? "#e65a5a" : "var(--text-secondary)" }}>
                  {d.license_expiry} {isExpired(d.license_expiry) && "(Expired)"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{d.contact_number}</td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{d.safety_score}%</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {!loading && drivers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center" style={{ color: "var(--text-muted)" }}>No drivers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Rule: Expired license or Suspended status &rarr; blocked from trip assignment.
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium">Add Driver</div>
              <button onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            {error && (
              <div className="text-[12px] mb-3 px-3 py-2 rounded-md" style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a" }}>
                {error}
              </div>
            )}
            <div className="space-y-3">
              <input className="input-field w-full" placeholder="Full Name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input-field w-full" placeholder="License Number"
                value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
              <select className="input-field w-full" value={form.license_category}
                onChange={(e) => setForm({ ...form, license_category: e.target.value })}>
                <option>LMV</option><option>HMV</option>
              </select>
              <div>
                <label className="text-[11px]" style={{ color: "var(--text-muted)" }}>License Expiry</label>
                <input type="date" className="input-field w-full mt-1" value={form.license_expiry}
                  onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
              </div>
              <input className="input-field w-full" placeholder="Contact Number"
                value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Save Driver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
