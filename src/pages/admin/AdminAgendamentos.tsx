import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useAgendamentos } from "../../hooks/useAgendamentos.ts";
import { useBarbeiros } from "../../hooks/useBarbeiros.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";
import type { StatusAgendamento } from "../../types/index.ts";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/promocoes", label: "Promoções" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/agendamentos", label: "Agendamentos" }
];

export function AdminAgendamentos() {
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<StatusAgendamento | "all">("all");
  const { barbeiros } = useBarbeiros(true);
  const { agendamentos, loading, atualizarStatus } = useAgendamentos({
    barberId: barberId || undefined,
    date: date || undefined,
    status
  });

  const csv = useMemo(() => {
    const header = ["codigo", "cliente", "telefone", "barbeiro", "servico", "data", "inicio", "status"];
    const rows = agendamentos.map((item) => [
      item.publicCode,
      item.clientName,
      item.clientPhone,
      item.barber?.name ?? "",
      item.service?.name ?? "",
      item.appointmentDate,
      item.startTime,
      item.status
    ]);
    return [header, ...rows].map((line) => line.map((value) => `"${value}"`).join(",")).join("\n");
  }, [agendamentos]);

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agendamentos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pb-16">
      <Navbar authenticated links={adminLinks} subtitle="Tabela completa com filtros, exportação CSV e ações operacionais." title="Admin Agendamentos" />
      <main className="shell mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <BotaoVoltar to="/admin" />
          <button className="btn-primary" onClick={exportCsv} type="button">
            Exportar CSV
          </button>
        </div>
        <section className="surface-elevated grid gap-4 p-5 md:grid-cols-3">
          <select className="field" value={barberId} onChange={(event) => setBarberId(event.target.value)}>
            <option value="">Todos os barbeiros</option>
            {barbeiros.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
          <input className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value as StatusAgendamento | "all")}>
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
            <option value="completed">Concluído</option>
          </select>
        </section>
        {loading ? <Spinner /> : null}
        {agendamentos.length === 0 && !loading ? (
          <EmptyState description="Ajuste os filtros ou aguarde novos agendamentos." title="Nenhum agendamento encontrado" />
        ) : null}
        <div className="overflow-hidden rounded-[28px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.02)]">
          <table className="min-w-full divide-y divide-[rgba(201,169,110,0.08)] text-left text-sm text-[rgba(240,237,230,0.76)]">
            <thead className="bg-[rgba(201,169,110,0.06)] text-[#f0ede6]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Barbeiro</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Horário</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,169,110,0.08)]">
              {agendamentos.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#f0ede6]">{item.clientName}</p>
                    <p className="text-xs text-[rgba(240,237,230,0.42)]">{item.publicCode}</p>
                  </td>
                  <td className="px-4 py-3">{item.barber?.name}</td>
                  <td className="px-4 py-3">{item.service?.name}</td>
                  <td className="px-4 py-3">
                    {item.appointmentDate} {item.startTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`status-badge ${
                        item.status === "confirmed"
                          ? "status-badge-confirmed"
                          : item.status === "pending"
                            ? "status-badge-pending"
                            : item.status === "cancelled"
                              ? "status-badge-cancelled"
                              : "status-badge-confirmed"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-secondary px-3 py-2" onClick={() => void atualizarStatus(item.id, "confirmed")} type="button">
                        Confirmar
                      </button>
                      <button className="btn-secondary px-3 py-2" onClick={() => void atualizarStatus(item.id, "cancelled")} type="button">
                        Cancelar
                      </button>
                      <button className="btn-secondary px-3 py-2" onClick={() => void atualizarStatus(item.id, "completed")} type="button">
                        Concluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
