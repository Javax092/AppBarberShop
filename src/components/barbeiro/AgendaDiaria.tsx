import { getAllowedStatusActions } from "../../lib/agendamentos.ts";
import type { Agendamento } from "../../types/index.ts";
import { CardAgendamento } from "../agendamento/CardAgendamento.tsx";

export function AgendaDiaria({
  agendamentos,
  loadingId,
  onConfirmar,
  onCancelar,
  onConcluir
}: {
  agendamentos: Agendamento[];
  loadingId?: string;
  onConfirmar: (id: string) => void;
  onCancelar: (id: string) => void;
  onConcluir: (id: string) => void;
}) {
  if (agendamentos.length === 0) {
    return (
      <div className="rounded-[24px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.02)] px-5 py-6 text-sm text-[rgba(240,237,230,0.62)]">
        Nenhum atendimento agendado para hoje.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {agendamentos.map((item) => (
        <CardAgendamento
          key={item.id}
          actions={
            <>
              {getAllowedStatusActions(item.status).canConfirm ? (
                <button className="btn-secondary px-4 py-2" disabled={loadingId === item.id} onClick={() => onConfirmar(item.id)} type="button">
                  {loadingId === item.id ? "Confirmando..." : "Confirmar"}
                </button>
              ) : null}
              {getAllowedStatusActions(item.status).canCancel ? (
                <button className="btn-secondary px-4 py-2" disabled={loadingId === item.id} onClick={() => onCancelar(item.id)} type="button">
                  {loadingId === item.id ? "Cancelando..." : "Cancelar"}
                </button>
              ) : null}
              {getAllowedStatusActions(item.status).canComplete ? (
                <button className="btn-primary" disabled={loadingId === item.id} onClick={() => onConcluir(item.id)} type="button">
                  {loadingId === item.id ? "Concluindo..." : "Concluir"}
                </button>
              ) : null}
            </>
          }
          agendamento={item}
        />
      ))}
    </div>
  );
}
