import type { Agendamento } from "../../types/index.ts";
import { CardAgendamento } from "../agendamento/CardAgendamento.tsx";

export function AgendaDiaria({
  agendamentos,
  onConcluir
}: {
  agendamentos: Agendamento[];
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
        <CardAgendamento key={item.id} actionLabel="Concluir" agendamento={item} onAction={() => onConcluir(item.id)} />
      ))}
    </div>
  );
}
