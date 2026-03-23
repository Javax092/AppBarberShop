import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../../hooks/useAuth.tsx";
import { formatSupabaseError } from "../../lib/supabase.ts";

interface NavbarProps {
  title: string;
  subtitle?: string;
  links?: Array<{ to: string; label: string }>;
  authenticated?: boolean;
}

export function Navbar({ title, subtitle, links = [], authenticated = false }: NavbarProps) {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  async function handleLogout() {
    const confirmed = window.confirm("Deseja realmente sair?");
    if (!confirmed) {
      return;
    }

    try {
      await logout();
      toast.success("Sessao encerrada.");
      navigate("/");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    }
  }

  return (
    <header className="shell pt-6">
      <div className="hero-panel overflow-hidden px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <Link
                className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.06)] p-2"
                to="/"
              >
                <img alt="Opaitaon" className="max-h-full max-w-full object-contain" src="/paitaon.png" />
              </Link>
              <div>
                <Link className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#c9a96e]" to="/">
                  O Pai Tá On
                </Link>
                <p className="mt-1 text-xs uppercase tracking-[0.26em] text-[rgba(240,237,230,0.48)]">
                  Luxury barbershop booking system
                </p>
              </div>
            </div>

            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[0.94] text-[#f0ede6] sm:text-6xl lg:text-7xl">{title}</h1>
            {subtitle ? <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(240,237,230,0.66)] sm:text-base">{subtitle}</p> : null}
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  className={({ isActive }) =>
                    `rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition ${
                      isActive
                        ? "border-[rgba(201,169,110,0.5)] bg-[rgba(201,169,110,0.12)] text-[#f0ede6]"
                        : "border-[rgba(201,169,110,0.16)] bg-transparent text-[rgba(240,237,230,0.6)] hover:border-[rgba(201,169,110,0.42)] hover:text-[#f0ede6]"
                    }`
                  }
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            {!authenticated ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(240,237,230,0.42)]">Acesso interno</span>
                <Link className="access-chip" to="/admin/login">
                  Admin
                </Link>
                <Link className="access-chip" to="/barbeiro/login">
                  Barbeiro cadastrado
                </Link>
              </div>
            ) : null}
            {!authenticated ? (
              <Link className="btn-secondary px-6" to="/agendamento">
                Reservar atendimento
              </Link>
            ) : null}
            {authenticated ? (
              <div className="mt-1 flex items-center gap-3 self-start border-t border-[rgba(201,169,110,0.14)] pt-4 lg:self-auto">
                <span className="text-sm text-[rgba(240,237,230,0.66)]">{profile?.fullName}</span>
                <button className="btn-primary px-4 py-2" onClick={() => void handleLogout()} type="button">
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
