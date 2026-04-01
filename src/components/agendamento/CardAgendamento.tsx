import type { ReactNode } from "react";

import { getStatusAgendamentoLabel } from "../../lib/agendamentos.ts";
import type { Agendamento } from "../../types/index.ts";

export function CardAgendamento({
  agendamento,
  actionLabel,
  onAction,
  actionDisabled,
  actions
}: {
  agendamento: Agendamento;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actions?: ReactNode;
}) {
  const statusTone =
    agendamento.status === "confirmed"
      ? "status-badge-confirmed"
      : agendamento.status === "pending"
        ? "status-badge-pending"
        : agendamento.status === "cancelled"
          ? "status-badge-cancelled"
          : "status-badge-confirmed";

  return (
    <article className="surface-elevated p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a96e]">{agendamento.appointmentDate}</p>
            <span className={`status-badge ${statusTone}`}>{getStatusAgendamentoLabel(agendamento.status)}</span>
          </div>
          <h3 className="mt-3 font-display text-4xl leading-none text-[#f0ede6]">{agendamento.clientName}</h3>
          <p className="mt-3 text-sm text-[rgba(240,237,230,0.62)]">
            {agendamento.service?.name} • {agendamento.startTime.slice(0, 5)} • {agendamento.barber?.name}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[rgba(240,237,230,0.42)]">Código {agendamento.publicCode}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : onAction && actionLabel ? (
          <button className="btn-primary" disabled={actionDisabled} onClick={onAction} type="button">
            {actionDisabled ? "Atualizando..." : actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
