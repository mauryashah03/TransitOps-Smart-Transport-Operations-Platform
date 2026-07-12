import { Search, LogOut } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";

export default function Topbar({ title }: { title?: string }) {
  const { user, logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search size={15} color="var(--text-muted)" />
        <input
          placeholder="Search..."
          className="bg-transparent outline-none text-[13px] flex-1"
          style={{ color: "var(--text-primary)" }}
        />
      </div>
      {title && (
        <div className="text-sm font-medium hidden md:block" style={{ color: "var(--text-secondary)" }}>
          {title}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-[12px] font-medium">{user?.full_name}</div>
          <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {user ? ROLE_LABELS[user.role] : ""}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center rounded-full"
          style={{ width: 30, height: 30, background: "var(--accent)", color: "#14100c" }}
          title="Log out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
