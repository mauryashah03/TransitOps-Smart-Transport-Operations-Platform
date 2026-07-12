import { useEffect, useState } from "react";
import { fuelExpenseApi, vehiclesApi } from "../api/services";
import type { FuelLog, Expense, Vehicle } from "../types";

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: "", liters: "", cost: "", log_date: "" });
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: "", category: "toll", amount: "", expense_date: "", notes: "" });
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [f, e, v] = await Promise.all([
      fuelExpenseApi.listFuelLogs(), fuelExpenseApi.listExpenses(), vehiclesApi.list(),
    ]);
    setFuelLogs(f);
    setExpenses(e);
    setVehicles(v);
  }

  useEffect(() => { load(); }, []);

  function vehicleReg(id: number) {
    return vehicles.find((v) => v.id === id)?.registration_number ?? `#${id}`;
  }

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOperationalCost = totalFuelCost + totalExpenses;

  async function handleAddFuel() {
    setError(null);
    try {
      await fuelExpenseApi.createFuelLog({
        vehicle_id: Number(fuelForm.vehicle_id),
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        log_date: fuelForm.log_date,
      });
      setShowFuelModal(false);
      setFuelForm({ vehicle_id: "", liters: "", cost: "", log_date: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to log fuel");
    }
  }

  async function handleAddExpense() {
    setError(null);
    try {
      await fuelExpenseApi.createExpense({
        vehicle_id: Number(expenseForm.vehicle_id),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        notes: expenseForm.notes || undefined,
      });
      setShowExpenseModal(false);
      setExpenseForm({ vehicle_id: "", category: "toll", amount: "", expense_date: "", notes: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to log expense");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Fuel & Expense Management</div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => setShowFuelModal(true)}>+ Log Fuel</button>
          <button className="btn-ghost" onClick={() => setShowExpenseModal(true)}>+ Add Expense</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-4 pt-4 text-sm font-medium">Fuel Logs</div>
        <table className="w-full text-[13px] mt-2">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-4 py-2 font-normal">Vehicle</th>
              <th className="px-4 py-2 font-normal">Date</th>
              <th className="px-4 py-2 font-normal">Liters</th>
              <th className="px-4 py-2 font-normal">Cost</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.map((f) => (
              <tr key={f.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-4 py-2 font-medium">{vehicleReg(f.vehicle_id)}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{f.log_date}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{f.liters} L</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>&#8377;{f.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <div className="px-4 pt-4 text-sm font-medium">Other Expenses (Toll / Misc)</div>
        <table className="w-full text-[13px] mt-2">
          <thead>
            <tr style={{ color: "var(--text-muted)" }} className="text-left">
              <th className="px-4 py-2 font-normal">Vehicle</th>
              <th className="px-4 py-2 font-normal">Category</th>
              <th className="px-4 py-2 font-normal">Date</th>
              <th className="px-4 py-2 font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="table-row" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-4 py-2 font-medium">{vehicleReg(e.vehicle_id)}</td>
                <td className="px-4 py-2 capitalize" style={{ color: "var(--text-secondary)" }}>{e.category}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>{e.expense_date}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-secondary)" }}>&#8377;{e.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-4 py-3 text-[13px] font-medium" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          Total Operational Cost (Auto) = Fuel + Expenses = &#8377;{totalOperationalCost.toLocaleString()}
        </div>
      </div>

      {(showFuelModal || showExpenseModal) && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="card p-5 w-full max-w-sm">
            <div className="text-sm font-medium mb-4">{showFuelModal ? "Log Fuel" : "Add Expense"}</div>
            {error && (
              <div className="text-[12px] mb-3 px-3 py-2 rounded-md" style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a" }}>
                {error}
              </div>
            )}
            {showFuelModal ? (
              <div className="space-y-3">
                <select className="input-field w-full" value={fuelForm.vehicle_id}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
                <input className="input-field w-full" placeholder="Liters" type="number"
                  value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
                <input className="input-field w-full" placeholder="Cost" type="number"
                  value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
                <input className="input-field w-full" type="date"
                  value={fuelForm.log_date} onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-3">
                <select className="input-field w-full" value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
                <select className="input-field w-full" value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  <option value="toll">Toll</option><option value="misc">Misc</option>
                </select>
                <input className="input-field w-full" placeholder="Amount" type="number"
                  value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                <input className="input-field w-full" type="date"
                  value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
              </div>
            )}
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => { setShowFuelModal(false); setShowExpenseModal(false); }}>Cancel</button>
              <button className="btn-primary" onClick={showFuelModal ? handleAddFuel : handleAddExpense}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
