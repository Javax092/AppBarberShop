import { Link } from "react-router-dom";
import { toast } from "sonner";

import { CardAgendamento } from "../../components/agendamento/CardAgendamento.tsx";
import { AgendaDiaria } from "../../components/barbeiro/AgendaDiaria.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useAgendamentos } from "../../hooks/useAgendamentos.ts";
import { useAuth } from "../../hooks/useAuth.tsx";
import { formatSupabaseError } from "../../lib/supabase.ts";

export function BarbeiroDashboard() {
  const { profile } = useAuth();
  const { agendaHoje, proximos, dashboard, loading, atualizarStatus } = useAgendamentos(
    { barberId: profile?.barberId ?? undefined },
    profile
  );

  async function concluir(id: string) {
    try {
      await atualizarStatus(id, "completed");
      toast.success("Agendamento concluído.");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    }
  }

  return (
    <div className="pb-16">
      <Navbar authenticated links={[{ to: "/barbeiro", label: "Dashboard" }, { to: "/barbeiro/perfil", label: "Meu Perfil" }]} subtitle="Agenda do dia e próximos 7 dias." title={`Olá, ${profile?.fullName ?? "barbeiro"}`} />
      <main className="shell mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <BotaoVoltar to="/" />
          <Link className="btn-secondary" to="/barbeiro/perfil">
            Meu Perfil
          </Link>
        </div>
        {loading ? <Spinner /> : null}
        <section className="space-y-4">
          <div className="rounded-[24px] border border-white/8 bg-[rgba(10,10,10,0.24)] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40">Painel interno</p>
                <h2 className="mt-2 text-lg font-semibold text-[#f0ede6]">Resumo operacional do seu dia</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Uso interno
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Hoje</p>
                <strong className="mt-2 block text-3xl font-semibold text-[#f0ede6]">{dashboard?.todayAppointments ?? 0}</strong>
                <p className="mt-2 text-sm text-white/55">atendimentos agendados</p>
              </article>
              <article className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">7 dias</p>
                <strong className="mt-2 block text-3xl font-semibold text-[#f0ede6]">{dashboard?.weekAppointments ?? 0}</strong>
                <p className="mt-2 text-sm text-white/55">atendimentos previstos</p>
              </article>
              <article className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Faturamento</p>
                <strong className="mt-2 block text-3xl font-semibold text-[#f0ede6]">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dashboard?.estimatedRevenue ?? 0)}
                </strong>
                <p className="mt-2 text-sm text-white/55">estimativa do dia</p>
              </article>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Agenda interna</p>
            <h2 className="mt-2 font-display text-4xl text-[#f0ede6]">Agenda do dia</h2>
          </div>
          <AgendaDiaria agendamentos={agendaHoje} onConcluir={(id) => void concluir(id)} />
        </section>
        <section className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Próximos passos</p>
            <h2 className="mt-2 font-display text-4xl text-[#f0ede6]">Próximos agendamentos</h2>
          </div>
          <article className="surface-elevated p-5">
            {proximos.length === 0 ? (
              <p className="text-sm text-[rgba(240,237,230,0.62)]">Nenhum próximo agendamento confirmado.</p>
            ) : (
              <div className="grid gap-4">
                {proximos.map((item) => (
                  <CardAgendamento key={item.id} agendamento={item} />
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
