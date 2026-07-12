import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-app)", color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
