import { useAuth, ROLE_LABELS } from "../context/AuthContext";

const RBAC_MATRIX: { role: string; fleet: string; drivers: string; trips: string; fuelExp: string; analytics: string }[] = [
  { role: "Fleet Manager", fleet: "✓", drivers: "✓", trips: "—", fuelExp: "✓", analytics: "✓" },
  { role: "Dispatcher", fleet: "view", drivers: "—", trips: "✓", fuelExp: "✓", analytics: "—" },
  { role: "Safety Officer", fleet: "—", drivers: "✓", trips: "—", fuelExp: "—", analytics: "view" },
  { role: "Financial Analyst", fleet: "view", drivers: "—", trips: "—", fuelExp: "✓", analytics: "✓" },
];

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="card p-5">
        <div className="text-sm font-medium mb-4">General</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px]" style={{ color: "var(--text-muted)" }}>Depot Name</label>
            <input className="input-field w-full mt-1" defaultValue="Gandhinagar Depot" />
          </div>
          <div>
            <label className="text-[11px]" style={{ color: "var(--text-muted)" }}>Currency</label>
            <input className="input-field w-full mt-1" defaultValue="INR (₹)" />
          </div>
          <div>
            <label className="text-[11px]" style={{ color: "var(--text-muted)" }}>Distance Unit</label>
            <input className="input-field w-full mt-1" defaultValue="Kilometers" />
          </div>
          <div>
            <label className="text-[11px]" style={{ color: "var(--text-muted)" }}>Logged in as</label>
            <input className="input-field w-full mt-1" disabled value={`${user?.full_name} (${user ? ROLE_LABELS[user.role] : ""})`} />
          </div>
        </div>
        <button className="btn-primary mt-4">Save changes</button>
      </div>

      <div className="card p-5 overflow-x-auto">
        <div className="text-sm font-medium mb-4">Role-Based Access Control (RBAC)</div>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="py-2 font-normal">Role</th>
              <th className="py-2 font-normal">Fleet</th>
              <th className="py-2 font-normal">Drivers</th>
              <th className="py-2 font-normal">Trips</th>
              <th className="py-2 font-normal">Fuel/Exp</th>
              <th className="py-2 font-normal">Analytics</th>
            </tr>
          </thead>
          <tbody>
            {RBAC_MATRIX.map((r) => (
              <tr key={r.role} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="py-2 font-medium">{r.role}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>{r.fleet}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>{r.drivers}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>{r.trips}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>{r.fuelExp}</td>
                <td className="py-2" style={{ color: "var(--text-secondary)" }}>{r.analytics}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
