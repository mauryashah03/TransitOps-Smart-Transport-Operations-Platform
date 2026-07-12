import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { analyticsApi, dashboardApi } from "../api/services";
import type { VehicleAnalytics, DashboardKPIs } from "../types";
import KpiCard from "../components/KpiCard";

export default function Analytics() {
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [health, setHealth] = useState<{ registration_number: string; health_score: number }[]>([]);

  useEffect(() => {
    Promise.all([analyticsApi.vehicles(), dashboardApi.kpis(), analyticsApi.fleetHealth()]).then(
      ([v, k, h]) => {
        setVehicleAnalytics(v);
        setKpis(k);
        setHealth(h);
      }
    );
  }, []);

  const avgFuelEfficiency =
    vehicleAnalytics.length > 0
      ? (vehicleAnalytics.reduce((s, v) => s + v.fuel_efficiency_km_per_l, 0) / vehicleAnalytics.length).toFixed(1)
      : "0";
  const totalOperationalCost = vehicleAnalytics.reduce((s, v) => s + v.total_operational_cost, 0);
  const avgROI =
    vehicleAnalytics.length > 0
      ? (vehicleAnalytics.reduce((s, v) => s + v.roi_pct, 0) / vehicleAnalytics.length).toFixed(1)
      : "0";

  const costlyVehicles = [...vehicleAnalytics]
    .sort((a, b) => b.total_operational_cost - a.total_operational_cost)
    .slice(0, 5);

  const chartData = health.map((h) => ({ name: h.registration_number, score: h.health_score }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <KpiCard label="Fuel Efficiency" value={`${avgFuelEfficiency} km/l`} />
        <KpiCard label="Fleet Utilization" value={`${kpis?.fleet_utilization_pct ?? 0}%`} accent="var(--accent)" />
        <KpiCard label="Operational Cost" value={`₹${totalOperationalCost.toLocaleString()}`} />
        <KpiCard label="Avg. Vehicle ROI" value={`${avgROI}%`} accent="var(--status-available)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="text-sm font-medium mb-3">Fleet Health Score</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262a33" />
              <XAxis dataKey="name" stroke="#9199a8" fontSize={11} />
              <YAxis stroke="#9199a8" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#14171d", border: "1px solid #262a33", fontSize: 12 }} />
              <Bar dataKey="score" fill="#e07a3f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium mb-3">Top Costliest Vehicles</div>
          <div className="space-y-3">
            {costlyVehicles.map((v) => {
              const max = costlyVehicles[0]?.total_operational_cost || 1;
              const pct = Math.round((v.total_operational_cost / max) * 100);
              return (
                <div key={v.vehicle_id}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span>{v.registration_number}</span>
                    <span style={{ color: "var(--text-muted)" }}>₹{v.total_operational_cost.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg-panel-alt)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              );
            })}
            {costlyVehicles.length === 0 && (
              <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>No data yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-4 pt-4 text-sm font-medium">Vehicle ROI &amp; Cost Breakdown</div>
        <table className="w-full text-[13px] mt-2">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-4 py-2 font-normal">Vehicle</th>
              <th className="px-4 py-2 font-normal">Fuel Efficiency</th>
              <th className="px-4 py-2 font-normal">Fuel Cost</th>
              <th className="px-4 py-2 font-normal">Maintenance Cost</th>
              <th className="px-4 py-2 font-normal">Operational Cost</th>
              <th className="px-4 py-2 font-normal">ROI</th>
            </tr>
          </thead>
          <tbody>
            {vehicleAnalytics.map((v) => (
              <tr key={v.vehicle_id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-4 py-2 font-medium">{v.registration_number}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{v.fuel_efficiency_km_per_l} km/l</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>₹{v.total_fuel_cost.toLocaleString()}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>₹{v.total_maintenance_cost.toLocaleString()}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>₹{v.total_operational_cost.toLocaleString()}</td>
                <td className="px-4 py-2" style={{ color: v.roi_pct >= 0 ? "#3ec97a" : "#e65a5a" }}>{v.roi_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        ROI = (Revenue &minus; (Maintenance + Fuel)) / Acquisition Cost. Revenue projected from completed trip distance.
      </div>
    </div>
  );
}
