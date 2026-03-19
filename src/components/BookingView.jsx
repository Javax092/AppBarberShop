import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { BarberCard } from "./booking/BarberCard";
import { ServiceCard } from "./booking/ServiceCard";
import { Stepper } from "./ui/Stepper";
import { BarberCardSkeleton, ServiceCardSkeleton } from "./ui/Skeleton";
import { formatCurrency, formatDateLabel, formatLongDate } from "../utils/schedule";

function groupSlotsByPeriod(slots) {
  return {
    morning: slots.filter((slot) => Number(slot.value.slice(0, 2)) < 12),
    afternoon: slots.filter((slot) => Number(slot.value.slice(0, 2)) >= 12)
  };
}

function resolveAvailability(barber, availableSlots) {
  const barberSlots = availableSlots.filter((slot) => !slot.disabled);
  if (barberSlots.length && barberSlots[0]?.value) {
    const nowHour = new Date().getHours();
    const nextHour = Number(barberSlots[0].value.slice(0, 2));
    const isCurrentWindow = nextHour <= nowHour + 1;

    if (isCurrentWindow) {
      return {
        tone: "available",
        label: "Disponivel agora"
      };
    }

    return {
      tone: "upcoming",
      label: `Proximo horario ${barberSlots[0].value}`
    };
  }

  return {
    tone: "upcoming",
    label: `Proximo horario ${barber.workingHours.start}`
  };
}

function StepFrame({ children, direction, stepKey }) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.section
        key={stepKey}
        className="booking-step-frame"
        custom={direction}
        initial={{ opacity: 0, x: direction >= 0 ? 42 : -42 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction >= 0 ? -42 : 42 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        {children}
      </motion.section>
    </AnimatePresence>
  );
}

export function BookingView({
  barbers,
  selectedBarberId,
  onSelectBarber,
  bookingServices,
  selectedServiceIds,
  onToggleService,
  dateOptions,
  selectedDate,
  onSelectDate,
  availableSlots,
  recommendedSlots,
  selectedTime,
  onSelectTime,
  clientName,
  onClientNameChange,
  clientWhatsapp,
  onClientWhatsappChange,
  notes,
  onNotesChange,
  fieldErrors,
  onConfirmBooking,
  onResetBooking,
  onBookingConfirmed,
  isSaving,
  isLoading,
  selectedBarber,
  summaryServices,
  totals,
  confirmation,
  bookingProgress,
  bookingStatusMessage,
  bookingMomentLabel,
  isBookingReady
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [advancePressed, setAdvancePressed] = useState(false);
  const slotsByPeriod = useMemo(() => groupSlotsByPeriod(availableSlots), [availableSlots]);
  const canAdvance = [
    Boolean(selectedBarberId),
    selectedServiceIds.length > 0,
    Boolean(selectedTime),
    isBookingReady
  ];

  function goToStep(nextStep) {
    setDirection(nextStep > currentStep ? 1 : -1);
    setCurrentStep(nextStep);
  }

  function handleAdvance() {
    if (currentStep < 3 && canAdvance[currentStep]) {
      setAdvancePressed(true);
      window.setTimeout(() => setAdvancePressed(false), 100);
      goToStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }

  function handleReset() {
    setDirection(-1);
    setCurrentStep(0);
    onResetBooking();
  }

  async function handleConfirm() {
    const result = await onConfirmBooking();
    if (result?.ok) {
      setDirection(-1);
      setCurrentStep(0);
      onBookingConfirmed?.();
    }
  }

  return (
    <>
      <style>{`
        /* ALTERACAO: wizard de booking com grid premium, sticky actions mobile e cards conectados. */
        .booking-wizard-shell {
          display: grid;
          gap: 18px;
        }

        .booking-wizard-card {
          display: grid;
          gap: 18px;
        }

        .booking-step-content {
          display: grid;
          gap: 18px;
        }

        .booking-step-head h2,
        .booking-step-head p {
          margin: 0;
        }

        .booking-step-head {
          display: grid;
          gap: 10px;
        }

        .booking-barber-compact-grid,
        .booking-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .booking-services-grid .service-card-v2 {
          min-height: 100%;
        }

        .booking-step-actions {
          position: sticky;
          bottom: 0;
          z-index: 3;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 16px 0 calc(16px + env(safe-area-inset-bottom));
          background: linear-gradient(180deg, rgba(18,13,9,0), rgba(18,13,9,0.96) 40%);
        }

        .booking-step-actions .primary-button[disabled] {
          opacity: 0.4;
          pointer-events: none;
        }

        .booking-step-actions .primary-button[data-pressed="true"] {
          transform: scale(0.97);
        }

        .booking-service-pill {
          width: 100%;
        }

        .booking-tabs,
        .booking-day-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .booking-time-periods {
          display: grid;
          gap: 16px;
        }

        .booking-time-period {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }

        .booking-time-grid-compact {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
          gap: 10px;
        }

        .booking-summary-collapsed {
          display: grid;
          gap: 8px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }

        .booking-form-grid {
          display: grid;
          gap: 14px;
        }

        .booking-form-grid label {
          display: grid;
          gap: 8px;
        }

        .booking-empty-slots {
          color: var(--text-secondary);
        }

        @media (min-width: 1024px) {
          .booking-step-actions {
            position: static;
            padding-bottom: 0;
            background: transparent;
          }
        }
      `}</style>

      <section className="booking-wizard-shell">
        <div className="glass-card booking-wizard-card">
          <Stepper
            steps={bookingProgress.steps}
            currentStep={currentStep}
            onStepChange={(nextStep) => {
              if (nextStep <= currentStep || canAdvance[currentStep]) {
                goToStep(nextStep);
              }
            }}
          />

          <StepFrame direction={direction} stepKey={`step-${currentStep}`}>
            {currentStep === 0 ? (
              <div className="booking-step-content">
                <div className="booking-step-head">
                  <span className="mini-badge">Passo 1</span>
                  <h2>Escolha seu barbeiro</h2>
                  <p>{bookingStatusMessage}</p>
                </div>

                <div className="booking-barber-compact-grid">
                  {isLoading
                    ? Array.from({ length: 2 }).map((_, index) => <BarberCardSkeleton key={index} />)
                    : barbers.map((barber) => {
                        const availability = resolveAvailability(barber, availableSlots);

                        return (
                          <BarberCard
                            key={barber.id}
                            barber={barber}
                            selected={selectedBarberId === barber.id}
                            statusTone={availability.tone}
                            statusLabel={availability.label}
                            onClick={() => onSelectBarber(barber.id)}
                          />
                        );
                      })}
                </div>
                {fieldErrors.selectedBarberId ? <p className="field-error">{fieldErrors.selectedBarberId}</p> : null}

                <div className="booking-step-actions">
                  <button className="secondary-button" onClick={handleReset} type="button">
                    Reiniciar
                  </button>
                  <button
                    className="primary-button"
                    data-pressed={advancePressed}
                    onClick={handleAdvance}
                    type="button"
                    disabled={!canAdvance[0]}
                  >
                    Avancar
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="booking-step-content">
                <div className="booking-step-head">
                  <span className="mini-badge">Passo 2</span>
                  <h2>Monte seu atendimento</h2>
                  <p>Escolha os servicos que melhor constroem o seu visual.</p>
                </div>

                <div className="booking-services-grid">
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => <ServiceCardSkeleton key={index} />)
                    : bookingServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          name={service.name}
                          category={service.category}
                          price={formatCurrency(service.price)}
                          duration={`${service.duration} min`}
                          badge={service.badge}
                          selected={selectedServiceIds.includes(service.id)}
                          onClick={() => onToggleService(service.id)}
                        />
                      ))}
                </div>
                {fieldErrors.selectedServiceIds ? <p className="field-error">{fieldErrors.selectedServiceIds}</p> : null}

                <div className="booking-summary-collapsed">
                  <strong>Total</strong>
                  <span>
                    {formatCurrency(totals.subtotal)} • {totals.totalDuration} min
                  </span>
                </div>

                <div className="booking-step-actions">
                  <button className="secondary-button" onClick={handleBack} type="button">
                    Voltar
                  </button>
                  <button
                    className="primary-button"
                    data-pressed={advancePressed}
                    onClick={handleAdvance}
                    type="button"
                    disabled={!canAdvance[1]}
                  >
                    Avancar
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="booking-step-content">
                <div className="booking-step-head">
                  <span className="mini-badge">Passo 3</span>
                  <h2>Defina o melhor horario</h2>
                  <p>Selecione a data e reserve o encaixe ideal para o seu atendimento.</p>
                </div>

                <div className="booking-day-row" role="tablist" aria-label="Datas disponiveis">
                  {dateOptions.map((date) => (
                    <button
                      key={date}
                      className={`day-chip ${selectedDate === date ? "active" : ""}`}
                      onClick={() => onSelectDate(date)}
                      type="button"
                    >
                      {formatDateLabel(date)}
                    </button>
                  ))}
                </div>

                <div className="booking-time-periods">
                  <div className="booking-time-period">
                    <strong>Manha</strong>
                    <div className="booking-time-grid-compact">
                      {slotsByPeriod.morning.length ? (
                        slotsByPeriod.morning.map((slot) => (
                          <button
                            key={slot.value}
                            className={`time-chip time-chip-${slot.heat || "blocked"} ${recommendedSlots.some((item) => item.value === slot.value) ? "recommended" : ""} ${selectedTime === slot.value ? "active" : ""}`}
                            disabled={slot.disabled || isLoading}
                            onClick={() => onSelectTime(slot.value)}
                            type="button"
                          >
                            <span>{slot.value}</span>
                          </button>
                        ))
                      ) : (
                        <p className="booking-empty-slots">Sem slots pela manha.</p>
                      )}
                    </div>
                  </div>

                  <div className="booking-time-period">
                    <strong>Tarde</strong>
                    <div className="booking-time-grid-compact">
                      {slotsByPeriod.afternoon.length ? (
                        slotsByPeriod.afternoon.map((slot) => (
                          <button
                            key={slot.value}
                            className={`time-chip time-chip-${slot.heat || "blocked"} ${recommendedSlots.some((item) => item.value === slot.value) ? "recommended" : ""} ${selectedTime === slot.value ? "active" : ""}`}
                            disabled={slot.disabled || isLoading}
                            onClick={() => onSelectTime(slot.value)}
                            type="button"
                          >
                            <span>{slot.value}</span>
                          </button>
                        ))
                      ) : (
                        <p className="booking-empty-slots">Sem slots pela tarde.</p>
                      )}
                    </div>
                  </div>
                </div>
                {fieldErrors.selectedTime ? <p className="field-error">{fieldErrors.selectedTime}</p> : null}

                <div className="heatmap-legend booking-legend-tight">
                  <span><i className="heat-dot heat-easy" /> Facil</span>
                  <span><i className="heat-dot heat-tight" /> Recomendado</span>
                  <span><i className="heat-dot heat-blocked" /> Bloqueado</span>
                </div>

                <div className="booking-step-actions">
                  <button className="secondary-button" onClick={handleBack} type="button">
                    Voltar
                  </button>
                  <button
                    className="primary-button"
                    data-pressed={advancePressed}
                    onClick={handleAdvance}
                    type="button"
                    disabled={!canAdvance[2]}
                  >
                    Avancar
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="booking-step-content">
                <div className="booking-step-head">
                  <span className="mini-badge">Passo 4</span>
                  <h2>Feche sua reserva</h2>
                  <p>{bookingMomentLabel}</p>
                </div>

                <div className="booking-summary-collapsed">
                  <strong>{selectedBarber?.name || "-"}</strong>
                  <span>{summaryServices || "Selecione servicos"}</span>
                  <span>
                    {formatLongDate(selectedDate)} • {selectedTime || "Sem horario"}
                  </span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>

                <div className="form-grid booking-form-grid">
                  <label>
                    Nome
                    <input value={clientName} onChange={(event) => onClientNameChange(event.target.value)} />
                    {fieldErrors.clientName ? <span className="field-error">{fieldErrors.clientName}</span> : null}
                  </label>
                  <label>
                    WhatsApp
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={20}
                      placeholder="(92) 99999-9999"
                      value={clientWhatsapp}
                      onChange={(event) => onClientWhatsappChange(event.target.value)}
                    />
                    {fieldErrors.clientWhatsapp ? (
                      <span className="field-error">{fieldErrors.clientWhatsapp}</span>
                    ) : null}
                  </label>
                  <label className="full">
                    Observacoes do atendimento
                    <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} />
                  </label>
                </div>

                {confirmation ? (
                  <motion.div
                    className="confirmation-box booking-confirmation-inline"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.34, ease: "easeOut" }}
                  >
                    <div className="celebration-row" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="confirmation-top">
                      <span className="mini-badge">Confirmado</span>
                      <strong>{confirmation.id}</strong>
                    </div>
                    <div className="confirmation-check">✓</div>
                    <p>
                      Reserva confirmada para {formatLongDate(confirmation.date)} as {confirmation.startTime} com{" "}
                      {confirmation.barber?.name}.
                    </p>
                  </motion.div>
                ) : null}

                <div className="booking-step-actions">
                  <button className="secondary-button" onClick={handleBack} type="button">
                    Voltar
                  </button>
                  <button className="primary-button" onClick={handleConfirm} type="button" disabled={isSaving || isLoading}>
                    {isSaving ? "Salvando..." : "Confirmar reserva"}
                  </button>
                </div>
              </div>
            ) : null}
          </StepFrame>
        </div>
      </section>
    </>
  );
}
