import { addDays, format, getDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ResumoAgendamento } from "../../components/agendamento/ResumoAgendamento.tsx";
import { SeletorBarbeiro } from "../../components/agendamento/SeletorBarbeiro.tsx";
import { SeletorHorario } from "../../components/agendamento/SeletorHorario.tsx";
import { SeletorServico } from "../../components/agendamento/SeletorServico.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { useAgendamentos } from "../../hooks/useAgendamentos.ts";
import { usePublicBookingData } from "../../hooks/usePublicBookingData.ts";
import { useHorarios } from "../../hooks/useHorarios.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";
import type { HorarioSlot } from "../../types/index.ts";

const stepItems = [
  {
    title: "Barbeiro",
    accent: "Escolha entre especialista dedicado ou encaixe mais rápido.",
    feedback: "A seleção do profissional define o tom da experiência."
  },
  {
    title: "Serviço",
    accent: "Compare escopo, duração e valor sem sair da tela.",
    feedback: "Tudo foi organizado para reduzir dúvida na decisão."
  },
  {
    title: "Horário",
    accent: "Agenda real com leitura imediata dos encaixes disponíveis.",
    feedback: "Somente horários compatíveis com o serviço entram na grade."
  },
  {
    title: "Confirmação",
    accent: "Fechamento curto, validado e pronto para conversão.",
    feedback: "Último passo com dados mínimos e confirmação imediata."
  }
] as const;

function hasAvailabilityOnDate(
  value: string,
  availability: Array<{ barberId: string; dayOfWeek: number; isActive: boolean }>,
  barberId: string | null
) {
  const targetDay = getDay(new Date(`${value}T12:00:00`));

  return availability.some(
    (item) => item.isActive && item.dayOfWeek === targetDay && (!barberId || item.barberId === barberId)
  );
}

function findNextAvailableDate(
  value: string,
  availability: Array<{ barberId: string; dayOfWeek: number; isActive: boolean }>,
  barberId: string | null
) {
  const start = new Date(`${value}T12:00:00`);

  for (let offset = 0; offset < 30; offset += 1) {
    const candidate = format(addDays(start, offset), "yyyy-MM-dd");
    if (hasAvailabilityOnDate(candidate, availability, barberId)) {
      return candidate;
    }
  }

  return value;
}

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

export function AgendamentoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { barbers: barbeiros, services: servicos, availability: disponibilidade, scheduleBlocks: bloqueiosAgenda, loading: loadingPublicData } = usePublicBookingData();
  const { criar } = useAgendamentos();

  const [step, setStep] = useState(0);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(searchParams.get("barberId"));
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(searchParams.get("serviceId"));
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState<HorarioSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publicCode, setPublicCode] = useState<string | null>(null);

  const selectedService = useMemo(
    () => servicos.find((item) => item.id === selectedServiceId) ?? null,
    [selectedServiceId, servicos]
  );
  const selectedBarber = useMemo(
    () => barbeiros.find((item) => item.id === selectedBarberId) ?? undefined,
    [barbeiros, selectedBarberId]
  );
  const preloadedBookingData = useMemo(
    () => ({
      barbers: barbeiros,
      availability: disponibilidade,
      scheduleBlocks: bloqueiosAgenda
    }),
    [barbeiros, bloqueiosAgenda, disponibilidade]
  );
  const { slots, loading: loadingSlots } = useHorarios(
    date,
    selectedBarberId,
    selectedService?.durationMinutes ?? 0,
    preloadedBookingData
  );
  const currentStep = stepItems[step];
  const progress = ((step + 1) / stepItems.length) * 100;
  const lunchBlockNotice = useMemo(() => {
    const lunchBlock = bloqueiosAgenda.find(
      (item) => item.barberId === null && item.dayOfWeek === null && item.startTime === "12:30:00" && item.endTime === "14:00:00"
    );

    if (!lunchBlock) {
      return null;
    }

    return `${lunchBlock.label}: ${lunchBlock.startTime.slice(0, 5)} às ${lunchBlock.endTime.slice(0, 5)}.`;
  }, [bloqueiosAgenda]);
  const nextAvailableDate = useMemo(
    () => findNextAvailableDate(date, disponibilidade, selectedBarberId),
    [date, disponibilidade, selectedBarberId]
  );

  useEffect(() => {
    setSelectedSlot(null);
  }, [date, selectedBarberId, selectedServiceId]);

  useEffect(() => {
    if (!hasAvailabilityOnDate(date, disponibilidade, selectedBarberId) && nextAvailableDate !== date) {
      setDate(nextAvailableDate);
    }
  }, [date, disponibilidade, nextAvailableDate, selectedBarberId]);

  async function finalizeBooking(values: { clientName: string; clientPhone: string }) {
    if (!selectedService || !selectedSlot) {
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await criar({
        barberId: selectedSlot.barberId,
        serviceId: selectedService.id,
        clientName: values.clientName,
        clientPhone: values.clientPhone,
        appointmentDate: date,
        startTime: `${selectedSlot.time}:00`,
        notes: ""
      });

      setPublicCode(appointment.publicCode);
      toast.success("Agendamento confirmado.");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    const confirmed = window.confirm("Deseja cancelar este agendamento e voltar para a home?");
    if (confirmed) {
      navigate("/");
    }
  }

  return (
    <div className="pb-16">
      <Navbar
        subtitle="Fluxo premium em quatro etapas, com progressão linear, tipografia editorial e confirmação imediata."
        title="Reservar atendimento"
      />
      <main className="shell mt-8">
        <div className="flex items-center justify-between gap-3">
          <BotaoVoltar to={step === 0 ? "/" : undefined} />
          <button className="btn-secondary" onClick={handleCancel} type="button">
            Cancelar
          </button>
        </div>

        <div className="booking-shell mt-6">
          <div className="booking-main">
            <section className="booking-hero px-6 py-8 sm:px-8 sm:py-10">
              <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_320px]">
                <div>
                  <span className="section-kicker">Agendamento Opaitaon</span>
                  <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] text-[#f0ede6] sm:text-6xl">
                    Reserve seu horário com padrão de marca premium e zero atrito no fluxo.
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[rgba(240,237,230,0.68)] sm:text-base">
                    Cada etapa foi organizada para reduzir hesitação, destacar o que importa e manter a decisão sempre visível:
                    profissional, serviço, disponibilidade real e confirmação imediata.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="booking-metric px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Disponibilidade</p>
                      <p className="mt-3 font-display text-3xl text-[#f0ede6]">{loadingPublicData || loadingSlots ? "..." : slots.length}</p>
                      <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">opções reais para a data selecionada</p>
                    </div>
                    <div className="booking-metric px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Serviço</p>
                      <p className="mt-3 font-display text-3xl text-[#f0ede6]">
                        {selectedService ? `${selectedService.durationMinutes} min` : "--"}
                      </p>
                      <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">tempo previsto de atendimento</p>
                    </div>
                    <div className="booking-metric px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Confirmação</p>
                      <p className="mt-3 font-display text-3xl text-[#f0ede6]">4 etapas</p>
                      <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">com fechamento imediato ao final</p>
                    </div>
                  </div>

                  <div className="booking-feedback-panel mt-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Agora em foco</p>
                      <p className="mt-2 font-display text-3xl leading-none text-[#f0ede6]">{currentStep.title}</p>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">{currentStep.accent}</p>
                    </div>
                    <div className="min-w-[180px]">
                      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(240,237,230,0.45)]">
                        <span>Progressão</span>
                        <span>{step + 1}/4</span>
                      </div>
                      <div className="booking-inline-progress mt-3">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.58)]">{currentStep.feedback}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {stepItems.map((item, index) => {
                    const statusClass =
                      index === step
                        ? "booking-step booking-step-active"
                        : index < step
                          ? "booking-step booking-step-complete"
                          : "booking-step";

                    return (
                      <div key={item.title} className={`${statusClass} px-4 py-4`}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(240,237,230,0.45)]">
                              Etapa {index + 1}
                            </p>
                            <p className="mt-2 font-display text-3xl leading-none text-[#f0ede6]">{item.title}</p>
                            <p className="mt-2 text-sm text-[rgba(240,237,230,0.5)]">{item.accent}</p>
                          </div>
                          <span
                            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold ${
                              index <= step
                                ? "border-[#c9a96e] bg-[#c9a96e] text-[#16120d]"
                                : "border-[rgba(201,169,110,0.16)] text-[rgba(240,237,230,0.56)]"
                            }`}
                          >
                            {index < step ? "✓" : index + 1}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {publicCode ? (
              <EmptyState
                description={`Seu agendamento foi registrado com sucesso. Código da reserva: ${publicCode}`}
                title="Reserva confirmada"
              />
            ) : null}

            {!publicCode && step === 0 ? (
              <div className="booking-panel-enter">
                <SeletorBarbeiro
                  barbeiros={barbeiros}
                  onSelect={(value) => {
                    setSelectedBarberId(value);
                    setStep(1);
                  }}
                  selectedBarberId={selectedBarberId}
                />
              </div>
            ) : null}

            {!publicCode && step === 1 ? (
              <div className="booking-panel-enter">
                {!loadingPublicData && servicos.length === 0 ? <EmptyState description="Nenhum serviço disponível no momento." title="Catálogo vazio" /> : null}
                <SeletorServico
                  onSelect={(serviceId) => {
                    setSelectedServiceId(serviceId);
                    setStep(2);
                  }}
                  selectedServiceId={selectedServiceId}
                  servicos={servicos}
                />
              </div>
            ) : null}

            {!publicCode && step === 2 && selectedService ? (
              <div className="booking-panel-enter">
                <SeletorHorario
                  date={date}
                  loading={loadingSlots}
                  onDateChange={setDate}
                  onSelect={(slot) => {
                    setSelectedSlot(slot);
                    setStep(3);
                  }}
                  scheduleNotice={lunchBlockNotice}
                  selectedSlot={selectedSlot}
                  slots={slots}
                />
              </div>
            ) : null}

            {!publicCode && step === 3 && selectedService && selectedSlot ? (
              <ResumoAgendamento
                barber={selectedBarber}
                date={date}
                loading={submitting}
                onSubmit={finalizeBooking}
                service={selectedService}
                slot={selectedSlot}
              />
            ) : null}

            {!publicCode && step > 0 ? (
              <div className="flex justify-start">
                <button className="btn-secondary" onClick={() => setStep((current) => current - 1)} type="button">
                  Voltar
                </button>
              </div>
            ) : null}
          </div>

          <aside className="booking-sidebar">
            <section className="booking-summary-card p-6 sm:p-7">
              <span className="section-kicker">Visão da reserva</span>
              <h2 className="mt-4 font-display text-4xl text-[#f0ede6]">Tudo que importa, sempre no mesmo lugar.</h2>
              <p className="mt-3 text-sm leading-7 text-[rgba(240,237,230,0.62)]">
                Um resumo lateral evita perda de contexto e deixa a decisão final mais rápida.
              </p>

              <div className="booking-feedback-panel mt-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Etapa ativa</p>
                  <p className="mt-2 font-display text-3xl text-[#f0ede6]">{currentStep.title}</p>
                </div>
                <span className="choice-pill">Passo {step + 1}</span>
              </div>

              <div className="mt-6">
                <div className="booking-detail-row">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Profissional</p>
                    <p className="mt-2 text-sm text-[rgba(240,237,230,0.58)]">Seleção atual</p>
                  </div>
                  <p className="text-right text-sm font-medium text-[#f0ede6]">{selectedBarber?.name ?? "Primeiro disponível"}</p>
                </div>
                <div className="booking-detail-row">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Serviço</p>
                    <p className="mt-2 text-sm text-[rgba(240,237,230,0.58)]">Escopo escolhido</p>
                  </div>
                  <p className="max-w-[150px] text-right text-sm font-medium text-[#f0ede6]">
                    {selectedService?.name ?? "Ainda não definido"}
                  </p>
                </div>
                <div className="booking-detail-row">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Data</p>
                    <p className="mt-2 text-sm text-[rgba(240,237,230,0.58)]">Janela ativa</p>
                  </div>
                  <p className="max-w-[150px] text-right text-sm font-medium capitalize text-[#f0ede6]">
                    {formatAppointmentDate(date)}
                  </p>
                </div>
                <div className="booking-detail-row">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Horário</p>
                    <p className="mt-2 text-sm text-[rgba(240,237,230,0.58)]">Confirmação final</p>
                  </div>
                  <p className="text-right text-sm font-medium text-[#f0ede6]">{selectedSlot?.time ?? "Não selecionado"}</p>
                </div>
              </div>

              {selectedService ? (
                <div className="mt-6 rounded-[26px] border border-[rgba(201,169,110,0.14)] bg-[rgba(201,169,110,0.06)] px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Investimento</p>
                  <p className="mt-3 font-display text-4xl leading-none text-[#f0ede6]">
                    {selectedService.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(240,237,230,0.66)]">
                    {selectedService.durationMinutes} minutos com disponibilidade atualizada em tempo real.
                  </p>
                </div>
              ) : null}
            </section>

            <section className="booking-summary-card p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Padrão de experiência</p>
              <p className="mt-4 font-display text-3xl text-[#f0ede6]">Clareza visual, decisão rápida e fechamento seguro.</p>
              <div className="mt-5 space-y-3 text-sm text-[rgba(240,237,230,0.62)]">
                <p>Profissionais apresentados com posicionamento e contexto, não apenas lista fria.</p>
                <p>Serviços comparáveis por duração, valor e benefício.</p>
                <p>Horários exibidos só quando realmente estão livres.</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
