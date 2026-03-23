import { Link, useLocation } from "react-router-dom";

import { BotaoVoltar } from "../components/layout/BotaoVoltar.tsx";

export function AcessoRestritoPage() {
  const location = useLocation();
  const message =
    (location.state as { message?: string } | null)?.message ??
    "Esta area e restrita ao perfil autorizado.";

  return (
    <div className="min-h-screen py-10 text-white">
      <main className="mx-auto max-w-2xl px-4">
        <BotaoVoltar to="/" />
        <section className="hero-panel mt-6 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#c9a96e]">Permissao negada</p>
          <h1 className="mt-4 font-display text-6xl">Acesso restrito</h1>
          <p className="mt-3 text-sm leading-7 text-white/70">{message}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/">
              Voltar para a home
            </Link>
            <Link className="btn-secondary" to="/barbeiro/login">
              Login de barbeiro
            </Link>
            <Link className="btn-secondary" to="/admin/login">
              Login admin
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
