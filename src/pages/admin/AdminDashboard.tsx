import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";

import { CardAgendamento } from "../../components/agendamento/CardAgendamento.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useAgendamentos } from "../../hooks/useAgendamentos.ts";
import { useBarbeiros } from "../../hooks/useBarbeiros.ts";
import { usePromocoes } from "../../hooks/usePromocoes.ts";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/promocoes", label: "Promoções" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/agendamentos", label: "Agendamentos" }
];

export function AdminDashboard() {
  const { dashboard, proximos, loading } = useAgendamentos();
  const { promocoes } = usePromocoes(true);
  const { barbeiros, disponibilidade } = useBarbeiros(true);

  const alerts = [
    ...promocoes
      .filter((item) => item.status === "ativa" && differenceInDays(new Date(item.endsAt), new Date()) <= 3)
      .map((item) => ({
        id: item.id,
        title: "Promoção prestes a vencer",
        description: `${item.title} termina em breve.`
      })),
    ...barbeiros
      .filter((barber) => !disponibilidade.some((item) => item.barberId === barber.id))
      .map((barber) => ({
        id: barber.id,
        title: "Horário sem cobertura",
        description: `${barber.name} ainda não configurou disponibilidade.`
      }))
  ];

  const metrics = [
    { label: "Agendamentos hoje", value: String(dashboard?.todayAppointments ?? 0) },
    { label: "Esta semana", value: String(dashboard?.weekAppointments ?? 0) },
    {
      label: "Receita estimada",
      value: (dashboard?.estimatedRevenue ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }
  ];

  return (
    <div className="pb-16">
      <Navbar authenticated links={adminLinks} subtitle="Resumo operacional, receita estimada e alertas críticos." title="Admin Dashboard" />
      <main className="shell mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="surface-elevated h-fit p-5">
          <BotaoVoltar to="/" />
          <nav className="mt-5 grid gap-2">
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                className="rounded-[20px] border border-[rgba(201,169,110,0.12)] px-4 py-3 text-sm font-semibold text-[rgba(240,237,230,0.7)] transition hover:border-[rgba(201,169,110,0.36)] hover:text-[#f0ede6]"
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {loading || !dashboard ? <Spinner /> : null}

          <section className="rounded-[24px] border border-white/8 bg-[rgba(10,10,10,0.24)] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40">Painel interno</p>
                <h2 className="mt-2 text-lg font-semibold text-[#f0ede6]">Métricas operacionais protegidas</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Admin
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric) => (
                <article key={metric.label} className="rounded-[20px] border border-white/8 bg-black/15 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#f0ede6]">{metric.value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section-frame">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="section-kicker">Hoje</span>
                <h2 className="mt-3 font-display text-4xl text-[#f0ede6]">Próximos agendamentos</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              {proximos.slice(0, 8).map((item) => (
                <CardAgendamento key={item.id} agendamento={item} />
              ))}
            </div>
          </section>

          <section className="section-frame">
            <div>
              <span className="section-kicker">Alertas</span>
              <h2 className="mt-3 font-display text-4xl text-[#f0ede6]">Operação e cobertura</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="mt-5">
                <EmptyState description="Sem alertas críticos no momento." title="Tudo sob controle" />
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {alerts.map((alert) => (
                  <article key={alert.id} className="surface-elevated p-5">
                    <h3 className="font-display text-3xl text-[#f0ede6]">{alert.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[rgba(240,237,230,0.62)]">{alert.description}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
