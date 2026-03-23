import { useMemo, useState } from "react";
import { barbers, sampleAppointments, services } from "./data";
import {
  buildAppointmentEnd,
  buildBookingCode,
  buildWhatsAppLink,
  createDateOptions,
  formatCurrency,
  formatDateLabel,
  formatLongDate,
  generateTimeSlots,
  getServiceTotals,
  groupAppointmentsByBarber
} from "./utils/schedule";

const dateOptions = createDateOptions(12);

function App() {
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0].id);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);
  const [selectedServiceIds, setSelectedServiceIds] = useState(["corte-classico"]);
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [confirmation, setConfirmation] = useState(null);
  const [activeView, setActiveView] = useState("booking");
  const [selectedPanelBarberId, setSelectedPanelBarberId] = useState(barbers[0].id);

  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === selectedBarberId),
    [selectedBarberId]
  );

  const selectedPanelBarber = useMemo(
    () => barbers.find((barber) => barber.id === selectedPanelBarberId),
    [selectedPanelBarberId]
  );

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds]
  );

  const totals = useMemo(() => getServiceTotals(selectedServices), [selectedServices]);

  const availableSlots = useMemo(() => {
    if (!selectedBarber || selectedServices.length === 0) {
      return [];
    }

    return generateTimeSlots({
      barber: selectedBarber,
      date: selectedDate,
      totalDuration: totals.totalDuration,
      appointments
    });
  }, [appointments, selectedBarber, selectedDate, selectedServices.length, totals.totalDuration]);

  const appointmentsByBarber = useMemo(
    () => groupAppointmentsByBarber(appointments),
    [appointments]
  );

  const panelAppointments = useMemo(() => {
    const barberAppointments = appointmentsByBarber[selectedPanelBarberId] ?? [];
    return barberAppointments.slice().sort((left, right) => {
      if (left.date !== right.date) {
        return left.date.localeCompare(right.date);
      }

      return left.startTime.localeCompare(right.startTime);
    });
  }, [appointmentsByBarber, selectedPanelBarberId]);

  const summaryServices = selectedServices.map((service) => service.name).join(", ");

  function toggleService(serviceId) {
    setSelectedTime("");
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  }

  function resetForm() {
    setSelectedServiceIds(["corte-classico"]);
    setSelectedBarberId(barbers[0].id);
    setSelectedDate(dateOptions[0]);
    setSelectedTime("");
    setClientName("");
    setClientWhatsapp("");
    setNotes("");
    setConfirmation(null);
    setActiveView("booking");
  }

  function validateForm() {
    if (!selectedServices.length) {
      return "Escolha pelo menos um servico.";
    }

    if (!selectedTime) {
      return "Escolha um horario disponivel.";
    }

    if (clientName.trim().length < 3) {
      return "Informe seu nome.";
    }

    if (clientWhatsapp.replace(/\D/g, "").length < 10) {
      return "Informe um WhatsApp valido.";
    }

    return "";
  }

  function buildClientWhatsAppMessage(appointment) {
    const serviceList = appointment.services.map((service) => service.name).join(", ");
    return [
      "Agendamento confirmado na O Pai Ta On.",
      `Codigo: ${appointment.id}`,
      `Barbeiro: ${appointment.barber.name}`,
      `Data: ${formatLongDate(appointment.date)}`,
      `Horario: ${appointment.startTime}`,
      `Servicos: ${serviceList}`,
      `Valor total: ${formatCurrency(appointment.subtotal)}`
    ].join("\n");
  }

  function buildBarberWhatsAppMessage(appointment) {
    const serviceList = appointment.services.map((service) => service.name).join(", ");
    return [
      "Novo agendamento recebido.",
      `Codigo: ${appointment.id}`,
      `Cliente: ${appointment.clientName}`,
      `WhatsApp: ${appointment.clientWhatsapp}`,
      `Data: ${formatLongDate(appointment.date)}`,
      `Horario: ${appointment.startTime} ate ${appointment.endTime}`,
      `Servicos: ${serviceList}`,
      `Observacoes: ${appointment.notes || "Sem observacoes"}`
    ].join("\n");
  }

  function handleConfirmBooking() {
    const error = validateForm();
    if (error) {
      window.alert(error);
      return;
    }

    const barberAppointments = appointmentsByBarber[selectedBarber.id] ?? [];
    const bookingCode = buildBookingCode(selectedBarber.shortCode, selectedDate, barberAppointments.length);
    const endTime = buildAppointmentEnd(selectedTime, totals.totalDuration);

    const appointment = {
      id: bookingCode,
      barberId: selectedBarber.id,
      clientName: clientName.trim(),
      clientWhatsapp: clientWhatsapp.trim(),
      serviceIds: selectedServiceIds,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      notes: notes.trim()
    };

    setAppointments((current) => [...current, appointment]);

    const appointmentView = {
      ...appointment,
      barber: selectedBarber,
      services: selectedServices,
      subtotal: totals.subtotal,
      serviceDuration: totals.serviceDuration,
      totalDuration: totals.totalDuration,
      clientWhatsappLink: buildWhatsAppLink(
        clientWhatsapp,
        buildClientWhatsAppMessage({
          ...appointment,
          barber: selectedBarber,
          services: selectedServices,
          subtotal: totals.subtotal
        })
      ),
      barberWhatsappLink: buildWhatsAppLink(
        selectedBarber.phone,
        buildBarberWhatsAppMessage({
          ...appointment,
          barber: selectedBarber,
          services: selectedServices
        })
      )
    };

    setConfirmation(appointmentView);
    setActiveView("booking");
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">booking suite</span>
          <h1>O Pai Ta On</h1>
          <p>
            Um fluxo vendavel com agendamento premium, painel do barbeiro e acao
            de WhatsApp pronta para operar sem conflito de horarios.
          </p>
          <div className="hero-pills">
            <span>Cliente</span>
            <span>Painel</span>
            <span>WhatsApp</span>
            <span>Sem choque de agenda</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <strong>10 min</strong>
            <span>grade minima</span>
          </div>
          <div className="stat-card">
            <strong>10 a 15 min</strong>
            <span>buffer operacional</span>
          </div>
          <div className="stat-card">
            <strong>0 conflito</strong>
            <span>mesmo barbeiro, mesmo horario</span>
          </div>
        </div>
      </header>

      <nav className="tabbar">
        <button
          className={activeView === "booking" ? "active" : ""}
          onClick={() => setActiveView("booking")}
        >
          01. Cliente
        </button>
        <button
          className={activeView === "panel" ? "active" : ""}
          onClick={() => setActiveView("panel")}
        >
          02. Painel do barbeiro
        </button>
        <button
          className={activeView === "whatsapp" ? "active" : ""}
          onClick={() => setActiveView("whatsapp")}
        >
          03. WhatsApp operacional
        </button>
      </nav>

      {activeView === "booking" ? (
        <section className="layout-grid">
          <section className="glass-card">
            <div className="section-head">
              <div>
                <span className="mini-badge">Passo 1</span>
                <h2>Monte o atendimento</h2>
              </div>
              <p>O cliente pode selecionar mais de um servico no mesmo horario.</p>
            </div>

            <div className="service-grid">
              {services.map((service) => {
                const active = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    className={`service-card ${active ? "active" : ""}`}
                    onClick={() => toggleService(service.id)}
                  >
                    <span className="tag">{service.badge}</span>
                    <div className="service-topline">
                      <strong>{service.name}</strong>
                      <span>{formatCurrency(service.price)}</span>
                    </div>
                    <small>{service.category}</small>
                    <p>{service.description}</p>
                    <em>{service.duration} min</em>
                  </button>
                );
              })}
            </div>

            <div className="section-head">
              <div>
                <span className="mini-badge">Passo 2</span>
                <h2>Escolha o barbeiro</h2>
              </div>
              <p>Agenda individual e bloqueio automatico por profissional.</p>
            </div>

            <div className="barber-grid">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  className={`barber-card ${selectedBarberId === barber.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedBarberId(barber.id);
                    setSelectedTime("");
                  }}
                >
                  <div className="avatar">{barber.shortCode}</div>
                  <div>
                    <span className="tag">{barber.role}</span>
                    <strong>{barber.name}</strong>
                    <p>{barber.specialty}</p>
                    <small>
                      Expediente {barber.workingHours.start} - {barber.workingHours.end}
                    </small>
                  </div>
                </button>
              ))}
            </div>

            <div className="section-head">
              <div>
                <span className="mini-badge">Passo 3</span>
                <h2>Data e horario</h2>
              </div>
              <p>Intervalos de 10 minutos com buffer automatico de atendimento.</p>
            </div>

            <div className="day-row">
              {dateOptions.map((date) => (
                <button
                  key={date}
                  className={`day-chip ${selectedDate === date ? "active" : ""}`}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime("");
                  }}
                >
                  <span>{formatDateLabel(date)}</span>
                </button>
              ))}
            </div>

            <div className="time-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot.value}
                  className={`time-chip ${selectedTime === slot.value ? "active" : ""}`}
                  disabled={slot.disabled}
                  onClick={() => setSelectedTime(slot.value)}
                >
                  {slot.value}
                </button>
              ))}
            </div>

            <div className="section-head">
              <div>
                <span className="mini-badge">Passo 4</span>
                <h2>Dados do cliente</h2>
              </div>
              <p>Pronto para confirmar e disparar atendimento por WhatsApp.</p>
            </div>

            <div className="form-grid">
              <label>
                Nome
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} />
              </label>
              <label>
                WhatsApp
                <input
                  value={clientWhatsapp}
                  onChange={(event) => setClientWhatsapp(event.target.value)}
                />
              </label>
              <label className="full">
                Observacoes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="actions-row">
              <button className="primary-button" onClick={handleConfirmBooking}>
                Confirmar agendamento
              </button>
              <button className="secondary-button" onClick={resetForm}>
                Limpar fluxo
              </button>
            </div>
          </section>

          <aside className="glass-card summary-card">
            <div className="section-head">
              <div>
                <span className="mini-badge">Resumo live</span>
                <h2>Proposta do agendamento</h2>
              </div>
            </div>

            <dl className="summary-list">
              <div>
                <dt>Servicos</dt>
                <dd>{summaryServices || "Selecione ao menos um servico"}</dd>
              </div>
              <div>
                <dt>Barbeiro</dt>
                <dd>{selectedBarber.name}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{formatLongDate(selectedDate)}</dd>
              </div>
              <div>
                <dt>Horario</dt>
                <dd>{selectedTime || "Selecione um horario"}</dd>
              </div>
              <div>
                <dt>Duracao de servicos</dt>
                <dd>{totals.serviceDuration} min</dd>
              </div>
              <div>
                <dt>Buffer operacional</dt>
                <dd>{totals.buffer} min</dd>
              </div>
              <div>
                <dt>Janela bloqueada</dt>
                <dd>{totals.totalDuration} min</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatCurrency(totals.subtotal)}</dd>
              </div>
            </dl>

            {confirmation ? (
              <div className="confirmation-box">
                <div className="confirmation-top">
                  <span className="mini-badge">Reserva premium confirmada</span>
                  <strong>{confirmation.id}</strong>
                </div>
                <p>
                  {confirmation.clientName}, seu horario com {confirmation.barber.name} foi
                  reservado para {formatLongDate(confirmation.date)} as {confirmation.startTime}.
                </p>
                <div className="actions-stack">
                  <a className="primary-button" href={confirmation.clientWhatsappLink} target="_blank" rel="noreferrer">
                    Enviar confirmacao para cliente
                  </a>
                  <a className="secondary-button" href={confirmation.barberWhatsappLink} target="_blank" rel="noreferrer">
                    Avisar barbeiro no WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="notice-box">
                O barbeiro so recebe a confirmacao quando a acao de WhatsApp for disparada
                ou quando esse ponto for conectado a backend, webhook ou banco.
              </div>
            )}
          </aside>
        </section>
      ) : null}

      {activeView === "panel" ? (
        <section className="layout-grid single-column">
          <section className="glass-card">
            <div className="section-head">
              <div>
                <span className="mini-badge">Painel 02</span>
                <h2>Agenda do barbeiro</h2>
              </div>
              <p>Visao operacional para atender, confirmar e evitar sobreposicao.</p>
            </div>

            <div className="panel-toolbar">
              <div className="pill-switch">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    className={selectedPanelBarberId === barber.id ? "active" : ""}
                    onClick={() => setSelectedPanelBarberId(barber.id)}
                  >
                    {barber.name}
                  </button>
                ))}
              </div>
              <div className="panel-meta">
                <strong>{selectedPanelBarber.name}</strong>
                <span>{selectedPanelBarber.bio}</span>
              </div>
            </div>

            <div className="agenda-list">
              {panelAppointments.map((appointment) => {
                const bookedServices = services.filter((service) =>
                  appointment.serviceIds.includes(service.id)
                );

                return (
                  <article key={appointment.id} className="agenda-card">
                    <div>
                      <span className="tag">{appointment.id}</span>
                      <h3>{appointment.clientName}</h3>
                      <p>{bookedServices.map((service) => service.name).join(", ")}</p>
                    </div>
                    <div className="agenda-meta">
                      <strong>{formatLongDate(appointment.date)}</strong>
                      <span>
                        {appointment.startTime} ate {appointment.endTime}
                      </span>
                      <small>{appointment.clientWhatsapp}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}

      {activeView === "whatsapp" ? (
        <section className="layout-grid single-column">
          <section className="glass-card">
            <div className="section-head">
              <div>
                <span className="mini-badge">Fluxo 03</span>
                <h2>WhatsApp operacional</h2>
              </div>
              <p>Use como prova de venda agora. Depois, substitua por API oficial.</p>
            </div>

            <div className="whatsapp-grid">
              {appointments.slice().reverse().map((appointment) => {
                const barber = barbers.find((item) => item.id === appointment.barberId);
                const bookedServices = services.filter((service) =>
                  appointment.serviceIds.includes(service.id)
                );

                const clientLink = buildWhatsAppLink(
                  appointment.clientWhatsapp,
                  [
                    "Confirmacao de agendamento.",
                    `Codigo: ${appointment.id}`,
                    `Barbeiro: ${barber.name}`,
                    `Horario: ${appointment.startTime}`,
                    `Servicos: ${bookedServices.map((service) => service.name).join(", ")}`
                  ].join("\n")
                );

                const barberLink = buildWhatsAppLink(
                  barber.phone,
                  [
                    "Novo agendamento confirmado.",
                    `Cliente: ${appointment.clientName}`,
                    `Codigo: ${appointment.id}`,
                    `Data: ${formatLongDate(appointment.date)}`,
                    `Horario: ${appointment.startTime} ate ${appointment.endTime}`
                  ].join("\n")
                );

                return (
                  <article key={appointment.id} className="whatsapp-card">
                    <div>
                      <span className="tag">{appointment.id}</span>
                      <h3>{appointment.clientName}</h3>
                      <p>{barber.name}</p>
                    </div>
                    <div className="actions-stack">
                      <a className="primary-button" href={clientLink} target="_blank" rel="noreferrer">
                        WhatsApp do cliente
                      </a>
                      <a className="secondary-button" href={barberLink} target="_blank" rel="noreferrer">
                        WhatsApp do barbeiro
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="roadmap-box">
              <strong>04 e 05. Supabase</strong>
              <p>Base do projeto pronta para trocar o estado local por banco real quando fechar o primeiro cliente.</p>
              <strong>06. Deploy Vercel</strong>
              <p>Projeto compativel com deploy direto apos `npm run build` e com configuracao de SPA.</p>
              <strong>07. Upgrades premium</strong>
              <p>Planos mais caros podem incluir lembrete automatico, assinatura, recorrencia e relatórios.</p>
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}

export default App;
