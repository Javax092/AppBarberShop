import { format } from "date-fns";

import type { HorarioSlot } from "../../types/index.ts";
import { EmptyState } from "../ui/EmptyState.tsx";
import { Spinner } from "../ui/Spinner.tsx";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

export function SeletorHorario({
  date,
  onDateChange,
  slots,
  loading,
  scheduleNotice,
  selectedSlot,
  onSelect
}: {
  date: string;
  onDateChange: (value: string) => void;
  slots: HorarioSlot[];
  loading: boolean;
  scheduleNotice?: string | null;
  selectedSlot: HorarioSlot | null;
  onSelect: (slot: HorarioSlot) => void;
}) {
  return (
    <section className="surface-elevated p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="section-kicker">Etapa 3</span>
          <h2 className="mt-3 max-w-3xl font-display text-4xl text-[#f0ede6] sm:text-5xl">
            Encontre o melhor encaixe com disponibilidade real e leitura imediata da agenda.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
          A data fica em destaque e os horários são apresentados como opções prontas para confirmação, sem ruído visual.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="choice-card p-5">
          <div className="relative z-10">
            <label className="label" htmlFor="appointment-date">
              Data do atendimento
            </label>
            <input
              className="field"
              id="appointment-date"
              min={format(new Date(), "yyyy-MM-dd")}
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
            />

            <div className="mt-5 rounded-[24px] border border-[rgba(201,169,110,0.16)] bg-[rgba(201,169,110,0.06)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Data escolhida</p>
              <p className="mt-3 text-lg font-semibold capitalize text-[#f0ede6]">{formatDateLabel(date)}</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(240,237,230,0.58)]">
                A agenda abaixo considera somente horários compatíveis com a duração do serviço.
              </p>
              {scheduleNotice ? (
                <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.5)]">{scheduleNotice}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="choice-card p-5 sm:p-6">
          <div className="relative z-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Horários disponíveis</p>
                <h3 className="mt-3 font-display text-4xl text-[#f0ede6]">Slots prontos para reserva</h3>
              </div>
              <span className="text-sm text-[rgba(240,237,230,0.55)]">{slots.length} opções encontradas</span>
            </div>

            <div className="mt-5">
              {loading ? <Spinner label="Buscando horários..." /> : null}
              {!loading && slots.length === 0 ? (
                <EmptyState description="Escolha outra data ou outro barbeiro." title="Nenhum horário disponível" />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => {
                  const active = selectedSlot?.barberId === slot.barberId && selectedSlot.time === slot.time;

                  return (
                    <button
                      key={`${slot.barberId}-${slot.time}`}
                      className={`choice-card p-5 text-left ${active ? "choice-card-active" : ""}`}
                      onClick={() => onSelect(slot)}
                      type="button"
                    >
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Disponível</p>
                            <p className="mt-3 font-display text-4xl leading-none text-[#f0ede6]">{slot.time}</p>
                          </div>
                          <span className="choice-check">{active ? "✓" : "Livre"}</span>
                        </div>

                        <div className="mt-5 rounded-[22px] border border-[rgba(201,169,110,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(240,237,230,0.45)]">Profissional</p>
                          <p className="mt-2 text-sm font-medium text-[#f0ede6]">{slot.barberName}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="choice-pill">Confirmação imediata</span>
                          <span className="text-xs uppercase tracking-[0.22em] text-[rgba(240,237,230,0.42)]">
                            {active ? "Selecionado" : "Toque para escolher"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
