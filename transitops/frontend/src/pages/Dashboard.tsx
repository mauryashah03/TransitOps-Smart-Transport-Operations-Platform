import { useEffect, useState } from "react";
import { dashboardApi, tripsApi, vehiclesApi } from "../api/services";
import type { DashboardKPIs, Trip, Vehicle } from "../types";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      Promise.all([dashboardApi.kpis(), tripsApi.list(), vehiclesApi.list()])
        .then(([k, t, v]) => {
          setKpis(k);
          setTrips(t.slice(0, 6));
          setVehicles(v);
        })
        .finally(() => setLoading(false));
    };

    load(); // initial fetch
    const interval = setInterval(load, 5000); // poll every 5s
    window.addEventListener("focus", load); // refetch when tab regains focus

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  if (loading) return <div style={{ color: "var(--text-muted)" }}>Loading dashboard...</div>;

  const statusCounts = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});
  const total = vehicles.length || 1;
  const statusBars: { key: string; label: string; color: string }[] = [
    { key: "available", label: "Available", color: "var(--status-available)" },
    { key: "on_trip", label: "On Trip", color: "var(--status-ontrip)" },
    { key: "in_shop", label: "In Shop", color: "var(--status-shop)" },
    { key: "retired", label: "Retired", color: "var(--status-retired)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <KpiCard label="Active Vehicles" value={kpis?.active_vehicles ?? 0} />
        <KpiCard label="Available Vehicles" value={kpis?.available_vehicles ?? 0} accent="var(--status-available)" />
        <KpiCard label="In Maintenance" value={kpis?.vehicles_in_maintenance ?? 0} accent="var(--status-shop)" />
        <KpiCard label="Active Trips" value={kpis?.active_trips ?? 0} accent="var(--status-ontrip)" />
        <KpiCard label="Pending Trips" value={kpis?.pending_trips ?? 0} />
        <KpiCard label="Drivers On Duty" value={kpis?.drivers_on_duty ?? 0} />
        <KpiCard label="Fleet Utilization" value={`${kpis?.fleet_utilization_pct ?? 0}%`} accent="var(--accent)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="text-sm font-medium mb-3">Recent Trips</div>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ color: "var(--text-muted)" }} className="text-left">
                <th className="pb-2 font-normal">Trip</th>
                <th className="pb-2 font-normal">Route</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td className="py-2">{t.trip_code}</td>
                  <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                    {t.source} &rarr; {t.destination}
                  </td>
                  <td className="py-2">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center" style={{ color: "var(--text-muted)" }}>
                    No trips yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium mb-3">Vehicle Status</div>
          <div className="space-y-3">
            {statusBars.map(({ key, label, color }) => {
              const count = statusCounts[key] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <span style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg-panel-alt)" }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}