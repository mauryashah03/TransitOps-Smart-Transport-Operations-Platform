import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Bus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@transitops.in");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-app)" }}>
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: "var(--bg-panel)" }}>
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-md"
              style={{ width: 36, height: 36, background: "var(--accent)" }}
            >
              <Bus size={20} color="#14100c" />
            </div>
            <div>
              <div className="font-semibold">TransitOps</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Smart Transport Operations Platform
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>One login, four roles:</p>
          <ul className="space-y-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <li>&bull; Fleet Manager &mdash; Fleet, Maintenance</li>
            <li>&bull; Dispatcher &mdash; Dashboard, Trips</li>
            <li>&bull; Safety Officer &mdash; Drivers, Compliance</li>
            <li>&bull; Financial Analyst &mdash; Fuel & Expenses, Analytics</li>
          </ul>
        </div>
        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          TransitOps &copy; 2026 &middot; RBAC enabled
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Sign in to your account</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Enter your credentials to continue
            </p>
          </div>

          {error && (
            <div
              className="text-[12px] px-3 py-2 rounded-md"
              style={{ background: "rgba(230,90,90,0.1)", color: "#e65a5a", border: "1px solid rgba(230,90,90,0.3)" }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full mt-1"
              placeholder="you@transitops.in"
            />
          </div>
          <div>
            <label className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full mt-1"
              placeholder="********"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-[11px] mt-4 p-3 rounded-md" style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}>
            Demo credentials (password: <code>Password123!</code>):<br />
            manager@transitops.in &middot; dispatcher@transitops.in &middot; safety@transitops.in &middot; finance@transitops.in
          </div>
        </form>
      </div>
    </div>
  );
}
