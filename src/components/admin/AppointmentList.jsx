// src/components/admin/AppointmentList.jsx - lista filtravel de agendamentos com stepper de status e acao contextual para WhatsApp.
import { useState } from "react";
import { formatDateLabel, formatLongDate } from "../../utils/schedule";

const statusFlow = ["confirmed", "in-progress", "done"];
const statusLabel = { confirmed: "Confirmado", "in-progress": "Em andamento", done: "Concluido", cancelled: "Cancelado" };

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12a8 8 0 0 1-11.74 7.04L4 20l.96-4.26A8 8 0 1 1 20 12Z" />
      <path d="M9 10.5c.24 1.54 1.96 3.26 3.5 3.5" />
    </svg>
  );
}

/**
 * @param {{
 *   adminAppointments: import('../../types').Appointment[],
 *   adminBarberFilter: string,
 *   onAdminBarberFilterChange: (value: string) => void,
 *   adminStatusFilter: string,
 *   onAdminStatusFilterChange: (value: string) => void,
 *   adminDateFilter: string,
 *   onAdminDateFilterChange: (value: string) => void,
 *   dateOptions: string[],
 *   barbers: import('../../types').Barber[],
 *   onBeginEditAppointment: (appointment: import('../../types').Appointment) => void,
 *   statusUpdateId: string,
 *   onStatusChange: (id: string, nextStatus: string) => void,
 *   hydrateAppointmentView: (appointment: import('../../types').Appointment) => any,
 *   getAppointmentServiceList: (appointment: import('../../types').Appointment) => import('../../types').Service[]
 * }} props
 */
export function AppointmentList({
  adminAppointments,
  adminBarberFilter,
  onAdminBarberFilterChange,
  adminStatusFilter,
  onAdminStatusFilterChange,
  adminDateFilter,
  onAdminDateFilterChange,
  dateOptions,
  barbers,
  onBeginEditAppointment,
  statusUpdateId,
  onStatusChange,
  hydrateAppointmentView,
  getAppointmentServiceList
}) {
  const [confirmingCancelId, setConfirmingCancelId] = useState("");
  const cx = { wrap: "glass-card subsection-card", filters: "appointment-list__filters", item: "appointment-list__item" };

  return (
    <>
      <style>{`
        /* ALTERACAO: lista administrativa com filtros enxutos, stepper horizontal e cancelamento inline. */
        .appointment-list__filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .appointment-list__filters label,
        .appointment-list__item {
          display: grid;
          gap: 8px;
        }
        .appointment-list__item {
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .appointment-list__stepper {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .appointment-list__step {
          min-height: 40px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          color: var(--text-secondary);
        }
        .appointment-list__step[data-active="true"] {
          background: rgba(198,145,55,0.14);
          border-color: var(--color-gold);
          color: var(--color-gold-light);
        }
        .appointment-list__whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .appointment-list__whatsapp svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Agenda</span>
            <h2>Agendamentos</h2>
          </div>
          <p>Filtre, avise a equipe e avance o status operacional.</p>
        </div>

        <div className={cx.filters}>
          <label>Profissional<select value={adminBarberFilter} onChange={(event) => onAdminBarberFilterChange(event.target.value)}><option value="all">Todos</option>{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label>
          <label>Status<select value={adminStatusFilter} onChange={(event) => onAdminStatusFilterChange(event.target.value)}><option value="all">Todos</option><option value="confirmed">Confirmado</option><option value="in-progress">Em andamento</option><option value="done">Concluido</option><option value="cancelled">Cancelado</option></select></label>
          <label>Data<select value={adminDateFilter} onChange={(event) => onAdminDateFilterChange(event.target.value)}><option value="all">Todas</option>{dateOptions.map((date) => <option key={date} value={date}>{formatDateLabel(date)}</option>)}</select></label>
        </div>

        <div className="admin-list">
          {adminAppointments.map((appointment) => {
            const hydrated = hydrateAppointmentView(appointment);
            const services = getAppointmentServiceList(appointment);
            const currentIndex = statusFlow.indexOf(appointment.status);
            const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : "";
            return (
              <article key={appointment.id} className={cx.item}>
                <div className="actions-row" style={{ justifyContent: "space-between" }}>
                  <span className="tag">{appointment.id}</span>
                  <span className={`status-pill ${appointment.status}`}>{statusLabel[appointment.status] || appointment.status}</span>
                </div>
                <strong>{appointment.clientName}</strong>
                <p>{services.map((service) => service.name).join(", ")}</p>
                <small>{formatLongDate(appointment.date)} • {appointment.startTime} ate {appointment.endTime}</small>
                <div className="appointment-list__stepper" role="list" aria-label={`Status de ${appointment.clientName}`}>
                  {statusFlow.map((step) => <div key={step} className="appointment-list__step" data-active={statusFlow.indexOf(step) <= currentIndex}>{statusLabel[step]}</div>)}
                </div>
                <div className="actions-row">
                  <button className="secondary-button compact-button" aria-label={`Editar agendamento ${appointment.id}`} type="button" onClick={() => onBeginEditAppointment(appointment)}>Editar</button>
                  {nextStatus ? <button className="primary-button compact-button" aria-label={`Avancar agendamento ${appointment.id}`} type="button" disabled={statusUpdateId === appointment.id} onClick={() => onStatusChange(appointment.id, nextStatus)}>{statusUpdateId === appointment.id ? "Atualizando..." : `Avancar para ${statusLabel[nextStatus]}`}</button> : null}
                  <a className="secondary-button compact-button appointment-list__whatsapp" aria-label={`Avisar barbeiro sobre ${appointment.id}`} href={hydrated.barberWhatsappLink} target="_blank" rel="noreferrer"><WhatsappIcon />Avisar barbeiro</a>
                  {appointment.status !== "cancelled" ? (
                    confirmingCancelId === appointment.id ? (
                      <div className="actions-row">
                        <button className="secondary-button compact-button danger-button" aria-label={`Confirmar cancelamento de ${appointment.id}`} type="button" onClick={() => onStatusChange(appointment.id, "cancelled")}>Confirmar cancelamento</button>
                        <button className="secondary-button compact-button" aria-label="Fechar confirmacao de cancelamento" type="button" onClick={() => setConfirmingCancelId("")}>Voltar</button>
                      </div>
                    ) : (
                      <button className="secondary-button compact-button danger-button" aria-label={`Cancelar agendamento ${appointment.id}`} type="button" onClick={() => setConfirmingCancelId(appointment.id)}>Cancelar</button>
                    )
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
