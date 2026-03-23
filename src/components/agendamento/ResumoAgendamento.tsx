import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Barbeiro, HorarioSlot, Servico } from "../../types/index.ts";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatPhoneInput(value: string) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

const confirmSchema = z.object({
  clientName: z.string().min(3, "Informe o nome completo."),
  clientPhone: z.string().refine((value) => normalizePhone(value).length >= 10, "Informe um telefone válido.")
});

type ConfirmValues = z.infer<typeof confirmSchema>;

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

export function ResumoAgendamento({
  barber,
  service,
  date,
  slot,
  onSubmit,
  loading
}: {
  barber?: Barbeiro;
  service: Servico;
  date: string;
  slot: HorarioSlot;
  onSubmit: (values: ConfirmValues) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema)
  });

  const clientName = watch("clientName", "");
  const clientPhone = watch("clientPhone", "");
  const phoneDigits = normalizePhone(clientPhone);
  const completionLevel = useMemo(() => {
    let filled = 0;
    if (clientName.trim().length >= 3) {
      filled += 1;
    }
    if (phoneDigits.length >= 10) {
      filled += 1;
    }
    return filled;
  }, [clientName, phoneDigits.length]);

  const finalPrice = service.promotion
    ? service.price - service.price * (service.promotion.discountPercent / 100)
    : service.price;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="surface-elevated booking-panel-enter p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)}>
        <span className="section-kicker">Etapa 4</span>
        <h3 className="mt-3 max-w-2xl font-display text-4xl text-[#f0ede6] sm:text-5xl">
          Finalize sua reserva com um fechamento limpo, seguro e sem fricção.
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
          Os dados abaixo são o mínimo necessário para garantir identificação rápida e confirmação imediata do horário escolhido.
        </p>

        <div className="booking-feedback-panel mt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Status da etapa</p>
            <p className="mt-2 text-sm text-[rgba(240,237,230,0.76)]">
              {completionLevel === 2 ? "Tudo pronto para confirmar." : "Preencha nome e telefone para concluir a reserva."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="booking-inline-progress">
              <span style={{ width: `${(completionLevel / 2) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-[#f0ede6]">{completionLevel}/2</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="choice-card p-5 sm:col-span-2">
            <div className="relative z-10 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nome</label>
                <input
                  className={`field ${clientName.trim().length >= 3 ? "field-valid" : ""}`}
                  placeholder="Seu nome completo"
                  {...register("clientName")}
                />
                {errors.clientName ? <p className="mt-2 text-xs text-[#d09c9c]">{errors.clientName.message}</p> : null}
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  className={`field ${phoneDigits.length >= 10 ? "field-valid" : ""}`}
                  inputMode="numeric"
                  placeholder="(92) 99999-9999"
                  {...register("clientPhone", {
                    onChange: (event) => {
                      setValue("clientPhone", formatPhoneInput(event.target.value), {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      });
                    }
                  })}
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[rgba(240,237,230,0.42)]">Formato brasileiro com DDD</span>
                  <span className={phoneDigits.length >= 10 ? "text-[#b4c7a8]" : "text-[rgba(240,237,230,0.42)]"}>
                    {phoneDigits.length >= 10 ? "Validado" : `${phoneDigits.length}/11`}
                  </span>
                </div>
                {errors.clientPhone ? <p className="mt-2 text-xs text-[#d09c9c]">{errors.clientPhone.message}</p> : null}
              </div>
            </div>
          </div>

          <div className="choice-card p-5">
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Atendimento</p>
              <p className="mt-3 font-display text-3xl text-[#f0ede6]">{service.name}</p>
              <p className="mt-3 text-sm leading-7 text-[rgba(240,237,230,0.6)]">{service.description}</p>
            </div>
          </div>

          <div className="choice-card p-5">
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Encaixe</p>
              <p className="mt-3 font-display text-3xl text-[#f0ede6]">{slot.time}</p>
              <p className="mt-3 text-sm leading-7 text-[rgba(240,237,230,0.6)] capitalize">{formatBookingDate(date)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-[rgba(201,169,110,0.1)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[rgba(240,237,230,0.58)]">
            Reserva confirmada no sistema assim que o envio for concluído.
          </div>
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Confirmando..." : "Finalizar agendamento"}
          </button>
        </div>
      </form>

      <aside className="booking-summary-card booking-panel-enter p-6 sm:p-7">
        <h3 className="font-display text-4xl text-[#f0ede6]">Resumo da experiência</h3>

        <div className="mt-6">
          <div className="booking-detail-row">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">Barbeiro</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">Execução</p>
            </div>
            <p className="max-w-[160px] text-right text-sm font-medium text-[#f0ede6]">{barber?.name ?? slot.barberName}</p>
          </div>

          <div className="booking-detail-row">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">Serviço</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">Escopo final</p>
            </div>
            <p className="max-w-[160px] text-right text-sm font-medium text-[#f0ede6]">{service.name}</p>
          </div>

          <div className="booking-detail-row">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">Data</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">Dia reservado</p>
            </div>
            <p className="max-w-[160px] text-right text-sm font-medium capitalize text-[#f0ede6]">{formatBookingDate(date)}</p>
          </div>

          <div className="booking-detail-row">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">Horário</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.56)]">Início previsto</p>
            </div>
            <p className="text-right text-sm font-medium text-[#f0ede6]">{slot.time}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(201,169,110,0.16)] bg-[rgba(201,169,110,0.06)] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Valor final</p>
          <p className="mt-3 font-display text-5xl leading-none text-[#f0ede6]">
            {finalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          {service.promotion ? (
            <p className="mt-3 text-sm text-[rgba(240,237,230,0.38)] line-through">
              {service.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-[24px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c9a96e]">Garantia Opaitaon</p>
          <p className="mt-3 text-sm leading-7 text-[rgba(240,237,230,0.8)]">
            Fluxo com disponibilidade real, confirmação imediata e apresentação profissional do início ao fechamento.
          </p>
        </div>
      </aside>
    </div>
  );
}
