import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, Bus,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/trips", label: "Trips", icon: Route },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside
      className="flex flex-col shrink-0"
      style={{
        width: 220,
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="flex items-center justify-center rounded-md"
          style={{ width: 30, height: 30, background: "var(--accent)" }}
        >
          <Bus size={17} color="#14100c" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">TransitOps</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Fleet Operations
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                isActive ? "font-medium" : ""
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              background: isActive ? "var(--bg-panel-alt)" : "transparent",
              borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 text-[10px]" style={{ color: "var(--text-muted)" }}>
        TransitOps &copy; 2026 &middot; RBAC enabled
      </div>
    </aside>
  );
}
