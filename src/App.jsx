import { useEffect, useMemo, useState } from "react";
import { barbers, services } from "./data";
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus
} from "./lib/appointments";
import { isSupabaseConfigured } from "./lib/supabase";
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
  const [appointments, setAppointments] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [activeView, setActiveView] = useState("booking");
  const [selectedPanelBarberId, setSelectedPanelBarberId] = useState(barbers[0].id);
  const [adminBarberFilter, setAdminBarberFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminDateFilter, setAdminDateFilter] = useState("all");
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState("");
  const [dataSource, setDataSource] = useState(isSupabaseConfigured() ? "supabase" : "local");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      setIsLoadingAppointments(true);
      setLoadError("");

      try {
        const result = await listAppointments();
        if (!ignore) {
          setAppointments(result.data);
          setDataSource(result.source);
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error.message || "Falha ao carregar agendamentos.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingAppointments(false);
        }
      }
    }

    loadAppointments();

    return () => {
      ignore = true;
    };
  }, []);

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

  const adminAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (adminBarberFilter !== "all" && appointment.barberId !== adminBarberFilter) {
          return false;
        }

        if (adminStatusFilter !== "all" && appointment.status !== adminStatusFilter) {
          return false;
        }

        if (adminDateFilter !== "all" && appointment.date !== adminDateFilter) {
          return false;
        }

        return true;
      })
      .slice()
      .sort((left, right) => {
        if (left.date !== right.date) {
          return left.date.localeCompare(right.date);
        }

        return left.startTime.localeCompare(right.startTime);
      });
  }, [adminBarberFilter, adminDateFilter, adminStatusFilter, appointments]);

  const adminStats = useMemo(() => {
    const confirmed = appointments.filter((appointment) => appointment.status === "confirmed");
    const cancelled = appointments.filter((appointment) => appointment.status === "cancelled");
    const todayCount = appointments.filter((appointment) => appointment.date === dateOptions[0]).length;

    return {
      total: appointments.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      today: todayCount
    };
  }, [appointments]);

  const summaryServices = selectedServices.map((service) => service.name).join(", ");

  function hydrateAppointmentView(baseAppointment) {
    const barber = barbers.find((item) => item.id === baseAppointment.barberId);
    const appointmentServices = services.filter((service) =>
      baseAppointment.serviceIds.includes(service.id)
    );
    const appointmentTotals = getServiceTotals(appointmentServices);

    return {
      ...baseAppointment,
      barber,
      services: appointmentServices,
      subtotal: appointmentTotals.subtotal,
      serviceDuration: appointmentTotals.serviceDuration,
      totalDuration: appointmentTotals.totalDuration,
      clientWhatsappLink: buildWhatsAppLink(
        baseAppointment.clientWhatsapp,
        buildClientWhatsAppMessage({
          ...baseAppointment,
          barber,
          services: appointmentServices,
          subtotal: appointmentTotals.subtotal
        })
      ),
      barberWhatsappLink: buildWhatsAppLink(
        barber.phone,
        buildBarberWhatsAppMessage({
          ...baseAppointment,
          barber,
          services: appointmentServices
        })
      )
    };
  }

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
      return "Informe o nome do cliente.";
    }

    if (clientWhatsapp.replace(/\D/g, "").length < 10) {
      return "Informe um WhatsApp valido.";
    }

    return "";
  }

  function buildClientWhatsAppMessage(appointment) {
    const serviceList = appointment.services.map((service) => service.name).join(", ");
    return [
      "Agendamento confirmado na O Pai ta on.",
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

  async function handleConfirmBooking() {
    const error = validateForm();
    if (error) {
      window.alert(error);
      return;
    }

    setIsSaving(true);

    try {
      const barberAppointments = appointmentsByBarber[selectedBarber.id] ?? [];
      const bookingCode = buildBookingCode(
        selectedBarber.shortCode,
        selectedDate,
        barberAppointments.length
      );
      const endTime = buildAppointmentEnd(selectedTime, totals.totalDuration);

      const appointmentDraft = {
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

      const persisted = await createAppointment(appointmentDraft);
      setDataSource(persisted.source);
      setAppointments((current) => [...current, persisted.data]);
      setConfirmation(hydrateAppointmentView(persisted.data));
      setLoadError("");
      setActiveView("booking");
    } catch (saveError) {
      window.alert(saveError.message || "Nao foi possivel salvar o agendamento no banco.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(appointmentId, nextStatus) {
    setStatusUpdateId(appointmentId);

    try {
      const updated = await updateAppointmentStatus(appointmentId, nextStatus);
      setDataSource(updated.source);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, ...(updated.source === "supabase" ? updated.data : { status: nextStatus }) }
            : appointment
        )
      );

      setConfirmation((current) =>
        current && current.id === appointmentId
          ? { ...current, status: nextStatus }
          : current
      );
    } catch (error) {
      window.alert(error.message || "Nao foi possivel atualizar o status.");
    } finally {
      setStatusUpdateId("");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Dark premium booking suite</span>
          <h1>O Pai ta on</h1>
          <p>
            Um fluxo vendavel com agendamento premium, painel do barbeiro, painel
            de admin e acao de WhatsApp pronta para operar sem conflito de horarios.
          </p>
          <div className="hero-pills">
            <span>Cliente</span>
            <span>Painel</span>
            <span>Admin</span>
            <span>WhatsApp</span>
            <span>Sem choque de agenda</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <strong>{adminStats.today}</strong>
            <span>agendamentos hoje</span>
          </div>
          <div className="stat-card">
            <strong>{adminStats.confirmed}</strong>
            <span>confirmados</span>
          </div>
          <div className="stat-card">
            <strong>Banco real</strong>
            <span>{dataSource === "supabase" ? "Supabase conectado" : "modo local fallback"}</span>
          </div>
        </div>
      </header>

      <div className={`infra-banner ${dataSource === "supabase" ? "success" : ""}`}>
        <strong>{dataSource === "supabase" ? "Supabase ativo." : "Supabase nao configurado."}</strong>
        <span>
          {dataSource === "supabase"
            ? "Os agendamentos estao sendo lidos, geridos e gravados no banco."
            : "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para sair do fallback local."}
        </span>
      </div>

      {loadError ? <div className="infra-banner error">{loadError}</div> : null}

      <nav className="tabbar">
        <button className={activeView === "booking" ? "active" : ""} onClick={() => setActiveView("booking")}>
          01. Cliente
        </button>
        <button className={activeView === "panel" ? "active" : ""} onClick={() => setActiveView("panel")}>
          02. Painel do barbeiro
        </button>
        <button className={activeView === "whatsapp" ? "active" : ""} onClick={() => setActiveView("whatsapp")}>
          03. WhatsApp operacional
        </button>
        <button className={activeView === "admin" ? "active" : ""} onClick={() => setActiveView("admin")}>
          04. Admin
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
                  disabled={slot.disabled || isLoadingAppointments}
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
                <input value={clientWhatsapp} onChange={(event) => setClientWhatsapp(event.target.value)} />
              </label>
              <label className="full">
                Observacoes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>

            <div className="actions-row">
              <button className="primary-button" onClick={handleConfirmBooking} disabled={isSaving || isLoadingAppointments}>
                {isSaving ? "Salvando agendamento..." : "Confirmar agendamento"}
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
              <div><dt>Servicos</dt><dd>{summaryServices || "Selecione ao menos um servico"}</dd></div>
              <div><dt>Barbeiro</dt><dd>{selectedBarber.name}</dd></div>
              <div><dt>Data</dt><dd>{formatLongDate(selectedDate)}</dd></div>
              <div><dt>Horario</dt><dd>{selectedTime || "Selecione um horario"}</dd></div>
              <div><dt>Duracao de servicos</dt><dd>{totals.serviceDuration} min</dd></div>
              <div><dt>Buffer operacional</dt><dd>{totals.buffer} min</dd></div>
              <div><dt>Janela bloqueada</dt><dd>{totals.totalDuration} min</dd></div>
              <div><dt>Total</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
            </dl>

            {confirmation ? (
              <div className="confirmation-box">
                <div className="confirmation-top">
                  <span className="mini-badge">Reserva premium confirmada</span>
                  <strong>{confirmation.id}</strong>
                </div>
                <p>
                  {confirmation.clientName}, seu horario com {confirmation.barber.name} foi reservado para{" "}
                  {formatLongDate(confirmation.date)} as {confirmation.startTime}.
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
                {isLoadingAppointments
                  ? "Carregando agenda persistida..."
                  : "Selecione horario e confirme para gravar o agendamento de forma persistente."}
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
                      <span className={`status-pill ${appointment.status}`}>{appointment.status}</span>
                    </div>
                    <div className="agenda-meta">
                      <strong>{formatLongDate(appointment.date)}</strong>
                      <span>{appointment.startTime} ate {appointment.endTime}</span>
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
                const hydrated = hydrateAppointmentView(appointment);

                return (
                  <article key={appointment.id} className="whatsapp-card">
                    <div>
                      <span className="tag">{appointment.id}</span>
                      <h3>{appointment.clientName}</h3>
                      <p>{hydrated.barber.name}</p>
                      <span className={`status-pill ${appointment.status}`}>{appointment.status}</span>
                    </div>
                    <div className="actions-stack">
                      <a className="primary-button" href={hydrated.clientWhatsappLink} target="_blank" rel="noreferrer">
                        WhatsApp do cliente
                      </a>
                      <a className="secondary-button" href={hydrated.barberWhatsappLink} target="_blank" rel="noreferrer">
                        WhatsApp do barbeiro
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}

      {activeView === "admin" ? (
        <section className="layout-grid single-column">
          <section className="glass-card">
            <div className="section-head">
              <div>
                <span className="mini-badge">Painel 04</span>
                <h2>Admin da operacao</h2>
              </div>
              <p>Gerencie a agenda, filtre a operacao e controle o status dos agendamentos.</p>
            </div>

            <div className="admin-stats">
              <div className="metric-card">
                <strong>{adminStats.total}</strong>
                <span>Total de reservas</span>
              </div>
              <div className="metric-card">
                <strong>{adminStats.confirmed}</strong>
                <span>Confirmados</span>
              </div>
              <div className="metric-card">
                <strong>{adminStats.cancelled}</strong>
                <span>Cancelados</span>
              </div>
              <div className="metric-card">
                <strong>{adminStats.today}</strong>
                <span>Hoje</span>
              </div>
            </div>

            <div className="admin-filters">
              <label>
                Barbeiro
                <select value={adminBarberFilter} onChange={(event) => setAdminBarberFilter(event.target.value)}>
                  <option value="all">Todos</option>
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>{barber.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={adminStatusFilter} onChange={(event) => setAdminStatusFilter(event.target.value)}>
                  <option value="all">Todos</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>
              <label>
                Data
                <select value={adminDateFilter} onChange={(event) => setAdminDateFilter(event.target.value)}>
                  <option value="all">Todas</option>
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>{formatDateLabel(date)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-list">
              {adminAppointments.map((appointment) => {
                const hydrated = hydrateAppointmentView(appointment);

                return (
                  <article key={appointment.id} className="admin-card">
                    <div className="admin-card-main">
                      <div className="admin-card-head">
                        <span className="tag">{appointment.id}</span>
                        <span className={`status-pill ${appointment.status}`}>{appointment.status}</span>
                      </div>
                      <h3>{appointment.clientName}</h3>
                      <p>{hydrated.services.map((service) => service.name).join(", ")}</p>
                      <div className="admin-card-meta">
                        <span>{hydrated.barber.name}</span>
                        <span>{formatLongDate(appointment.date)}</span>
                        <span>{appointment.startTime} ate {appointment.endTime}</span>
                        <span>{appointment.clientWhatsapp}</span>
                      </div>
                    </div>
                    <div className="admin-card-actions">
                      <button
                        className="secondary-button"
                        disabled={statusUpdateId === appointment.id || appointment.status === "confirmed"}
                        onClick={() => handleStatusChange(appointment.id, "confirmed")}
                      >
                        {statusUpdateId === appointment.id ? "Atualizando..." : "Confirmar"}
                      </button>
                      <button
                        className="secondary-button danger-button"
                        disabled={statusUpdateId === appointment.id || appointment.status === "cancelled"}
                        onClick={() => handleStatusChange(appointment.id, "cancelled")}
                      >
                        {statusUpdateId === appointment.id ? "Atualizando..." : "Cancelar"}
                      </button>
                      <a className="primary-button" href={hydrated.barberWhatsappLink} target="_blank" rel="noreferrer">
                        Avisar barbeiro
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}

export default App;
