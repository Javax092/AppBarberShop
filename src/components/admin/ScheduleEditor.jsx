// src/components/admin/ScheduleEditor.jsx - editor operacional de agendamentos e bloqueios em grid administrativo de duas colunas.
import { formatCurrency, formatLongDate } from "../../utils/schedule";

function BlockIcon({ type }) {
  const paths = {
    unavailable: "M6 6l12 12M18 6 6 18",
    lunch: "M8 4v7a4 4 0 1 0 8 0V4M12 4v16",
    day_off: "M7 4h10l-1 3 2 2-2 2 1 3H7z"
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type] || paths.unavailable} />
    </svg>
  );
}

/**
 * @param {{
 *   editorForm: any,
 *   onEditorChange: (field: string, value: string|boolean) => void,
 *   editorAvailableSlots: Array<{ value: string, disabled?: boolean }>,
 *   editorServicesCatalog: import('../../types').Service[],
 *   onToggleEditorService: (serviceId: string) => void,
 *   onSaveAppointmentEdits: () => void,
 *   isUpdatingAppointment: boolean,
 *   editorTotals: { subtotal: number, totalDuration: number },
 *   barbers: import('../../types').Barber[],
 *   blockForm: any,
 *   onBlockFormChange: (field: string, value: string|boolean) => void,
 *   onCreateBlock: (event: React.FormEvent<HTMLFormElement>) => void,
 *   blockFeedback: string,
 *   scheduleBlocks: import('../../types').ScheduleBlock[],
 *   blockActionId: string,
 *   onDeleteBlock: (id: string) => void
 * }} props
 */
export function ScheduleEditor({
  editorForm,
  onEditorChange,
  editorAvailableSlots,
  editorServicesCatalog,
  onToggleEditorService,
  onSaveAppointmentEdits,
  isUpdatingAppointment,
  editorTotals,
  barbers,
  blockForm,
  onBlockFormChange,
  onCreateBlock,
  blockFeedback,
  scheduleBlocks,
  blockActionId,
  onDeleteBlock
}) {
  const cx = {
    wrap: "glass-card subsection-card",
    grid: "schedule-editor__grid"
  };

  return (
    <>
      <style>{`
        /* ALTERACAO: agenda administrativa repartida em editor e bloqueios lado a lado com resumo vivo. */
        .schedule-editor__grid {
          display: grid;
          gap: 18px;
        }
        .schedule-editor__pane {
          display: grid;
          gap: 16px;
        }
        .schedule-editor__summary,
        .schedule-editor__block {
          display: grid;
          gap: 8px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .schedule-editor__block {
          grid-template-columns: 16px 1fr auto;
          align-items: start;
        }
        .schedule-editor__block svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          color: var(--color-gold-light);
          margin-top: 2px;
        }
        @media (min-width: 1024px) {
          .schedule-editor__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Agenda</span>
            <h2>Remarcar, editar e bloquear</h2>
          </div>
          <p>Editor e bloqueios operacionais no mesmo contexto.</p>
        </div>

        <div className={cx.grid}>
          <div className="schedule-editor__pane">
            {editorForm ? (
              <>
                <div className="form-grid">
                  <label>Cliente<input value={editorForm.clientName} onChange={(event) => onEditorChange("clientName", event.target.value)} /></label>
                  <label>WhatsApp<input value={editorForm.clientWhatsapp} onChange={(event) => onEditorChange("clientWhatsapp", event.target.value)} /></label>
                  <label>Profissional<select value={editorForm.barberId} onChange={(event) => onEditorChange("barberId", event.target.value)}>{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label>
                  <label>Status<select value={editorForm.status} onChange={(event) => onEditorChange("status", event.target.value)}><option value="confirmed">Confirmado</option><option value="in-progress">Em andamento</option><option value="done">Concluido</option><option value="cancelled">Cancelado</option></select></label>
                  <label>Data<input type="date" value={editorForm.date} onChange={(event) => onEditorChange("date", event.target.value)} /></label>
                  <label>Horario<select value={editorForm.startTime} onChange={(event) => onEditorChange("startTime", event.target.value)}><option value="">Selecione</option>{editorAvailableSlots.map((slot) => <option key={slot.value} value={slot.value} disabled={slot.disabled}>{slot.value}</option>)}</select></label>
                  <label className="full">Servicos<div className="service-grid compact-grid">{editorServicesCatalog.map((service) => <button className={`service-card compact-card ${editorForm.serviceIds.includes(service.id) ? "active" : ""}`} aria-label={`Alternar servico ${service.name}`} type="button" key={service.id} onClick={() => onToggleEditorService(service.id)}><strong>{service.name}</strong><small>{formatCurrency(service.price)}</small></button>)}</div></label>
                  <label className="full">Observacoes<textarea value={editorForm.notes} onChange={(event) => onEditorChange("notes", event.target.value)} /></label>
                </div>
                <div className="schedule-editor__summary">
                  <span>Total recalculado: {formatCurrency(editorTotals.subtotal)}</span>
                  <span>Tempo reservado: {editorTotals.totalDuration} min</span>
                </div>
                <button className="primary-button" aria-label="Salvar alteracoes do agendamento" type="button" onClick={onSaveAppointmentEdits} disabled={isUpdatingAppointment}>
                  {isUpdatingAppointment ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </>
            ) : (
              <div className="notice-box">Selecione um agendamento abaixo para abrir o editor e remarcar.</div>
            )}
          </div>

          <div className="schedule-editor__pane">
            <form className="form-grid block-form" onSubmit={onCreateBlock}>
              <label>Profissional<select value={blockForm.barberId} onChange={(event) => onBlockFormChange("barberId", event.target.value)}>{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}</select></label>
              <label>Data<input type="date" value={blockForm.date} onChange={(event) => onBlockFormChange("date", event.target.value)} /></label>
              <label>Tipo<select value={blockForm.blockType} onChange={(event) => onBlockFormChange("blockType", event.target.value)}><option value="unavailable">Indisponivel</option><option value="lunch">Almoco</option><option value="day_off">Folga</option></select></label>
              <label className="full">Titulo<input value={blockForm.title} onChange={(event) => onBlockFormChange("title", event.target.value)} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={blockForm.isAllDay} onChange={(event) => onBlockFormChange("isAllDay", event.target.checked)} />Bloqueio o dia todo</label>
              {!blockForm.isAllDay ? <><label>Inicio<input type="time" value={blockForm.startTime} onChange={(event) => onBlockFormChange("startTime", event.target.value)} /></label><label>Fim<input type="time" value={blockForm.endTime} onChange={(event) => onBlockFormChange("endTime", event.target.value)} /></label></> : null}
              <label className="full">Observacoes<textarea value={blockForm.notes} onChange={(event) => onBlockFormChange("notes", event.target.value)} /></label>
              <button className="primary-button" aria-label="Salvar bloqueio operacional" type="submit">Salvar bloqueio</button>
              {blockFeedback ? <p className="feedback-line">{blockFeedback}</p> : null}
            </form>
            {scheduleBlocks.map((block) => {
              const barber = barbers.find((item) => item.id === block.barberId);
              return (
                <article key={block.id} className="schedule-editor__block">
                  <BlockIcon type={block.blockType} />
                  <div>
                    <strong>{block.title || "Bloqueio operacional"}</strong>
                    <p>{barber?.name || "Equipe"} • {formatLongDate(block.date)}</p>
                    <small>{block.isAllDay ? "Dia todo" : `${block.startTime} ate ${block.endTime}`}</small>
                  </div>
                  <button className="secondary-button compact-button" aria-label={`Remover bloqueio ${block.title || block.id}`} type="button" onClick={() => onDeleteBlock(block.id)} disabled={blockActionId === block.id}>
                    {blockActionId === block.id ? "Removendo..." : "Remover"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
