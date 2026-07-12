import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { login as loginRequest } from "../api/services";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("transitops_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    localStorage.setItem("transitops_token", data.access_token);
    localStorage.setItem("transitops_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<string, string> = {
  fleet_manager: "Fleet Manager",
  driver: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};
