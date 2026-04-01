import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.tsx";
import type { PerfilAcesso } from "../../types/index.ts";
import { Spinner } from "../ui/Spinner.tsx";

export function ProtectedRoute({ role }: { role?: PerfilAcesso }) {
  const location = useLocation();
  const { authError, loading, session, profile } = useAuth();
  const hasAppUserSession = profile?.authMode === "app_users";
  const hasRealAdminSession = Boolean(session && profile?.role === "admin" && profile?.authMode === "supabase");
  const isAuthenticated = Boolean(profile && (role === "admin" ? hasRealAdminSession : session || hasAppUserSession));
  const deniedMessage =
    role === "admin" && authError
      ? authError
      : "Faca login para acessar esta area interna.";

  if (loading) {
    return (
      <div className="shell flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <Navigate
        replace
        state={{
          from: location,
          message: deniedMessage
        }}
        to={role === "admin" ? "/admin/login" : "/barbeiro/login"}
      />
    );
  }

  if (role && profile.role !== role) {
    return (
      <Navigate
        replace
        state={{
          message: "Seu perfil atual nao tem permissao para acessar esta area."
        }}
        to="/acesso-restrito"
      />
    );
  }

  return <Outlet />;
}
