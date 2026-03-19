import { useMemo } from "react";
import { useSwipe } from "../../hooks/useSwipe";
import { useVibration } from "../../hooks/useVibration";

const STATUS_LABELS = {
  confirmed: "Confirmado",
  "in-progress": "Em andamento",
  done: "Concluido",
  cancelled: "Cancelado"
};

export function AgendaCard({
  appointment,
  onAdvanceStatus,
  onCancel,
  onOpenWhatsapp
}) {
  const vibration = useVibration();
  const threshold = 60;

  // ALTERACAO: swipe-right avanca o atendimento com feedback haptico.
  const swipe = useSwipe({
    threshold,
    onSwipeRight: () => {
      if (appointment.status !== "cancelled" && appointment.status !== "done") {
        vibration.confirm();
        onAdvanceStatus?.(appointment);
      }
    },
    onSwipeLeft: () => {
      if (appointment.status !== "cancelled") {
        vibration.error();
        onCancel?.(appointment);
      }
    }
  });

  // ALTERACAO: indicador visual da intencao de swipe com clamp de deslocamento.
  const translateX = useMemo(
    () => Math.max(-96, Math.min(96, swipe.distance)),
    [swipe.distance]
  );

  return (
    <>
      <style>{`
        /* ALTERACAO: card operacional com swipe-to-action mobile e status integrado. */
        .agenda-card-v2 {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-soft);
          background: var(--surface-elevated);
          box-shadow: var(--shadow-md);
        }

        .agenda-card-v2__rail {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 var(--space-4);
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-caps);
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .agenda-card-v2__rail span:first-child {
          color: var(--status-success);
        }

        .agenda-card-v2__rail span:last-child {
          color: var(--status-danger);
        }

        .agenda-card-v2__body {
          position: relative;
          z-index: 1;
          display: grid;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--surface-elevated);
          transform: translate3d(var(--agenda-translate, 0px), 0, 0);
          transition: transform .18s var(--ease-smooth);
          will-change: transform;
        }

        .agenda-card-v2__topline {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          align-items: center;
        }

        .agenda-card-v2__status {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          padding: 0 var(--space-3);
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-soft);
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-caps);
          text-transform: uppercase;
          background: rgba(255,255,255,.04);
        }

        .agenda-card-v2__status[data-status="confirmed"] {
          color: var(--color-gold-light);
        }

        .agenda-card-v2__status[data-status="in-progress"] {
          color: var(--status-info);
        }

        .agenda-card-v2__status[data-status="done"] {
          color: var(--status-success);
        }

        .agenda-card-v2__status[data-status="cancelled"] {
          color: var(--status-danger);
        }

        .agenda-card-v2__actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .agenda-card-v2__button {
          min-height: 48px;
          padding: 0 var(--space-4);
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,.04);
          color: var(--text-primary);
          font: inherit;
          cursor: pointer;
        }

        .agenda-card-v2__button--danger {
          color: var(--status-danger);
        }

        .agenda-card-v2__button:focus-visible {
          outline: 2px solid var(--color-gold-light);
          outline-offset: 2px;
        }
      `}</style>

      <article className="agenda-card-v2" aria-label={`Agendamento de ${appointment.clientName}`}>
        <div className="agenda-card-v2__rail" aria-hidden="true">
          {/* ALTERACAO: trilha visual orienta o gesto antes do usuario interagir. */}
          <span>Deslize para avancar</span>
          <span>Deslize para cancelar</span>
        </div>

        <div
          className="agenda-card-v2__body"
          style={{ "--agenda-translate": `${translateX}px` }}
          {...swipe.handlers}
        >
          <div className="agenda-card-v2__topline">
            <div>
              <strong>{appointment.clientName}</strong>
              <p style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>
                {appointment.startTime} • {appointment.services?.map((service) => service.name).join(", ") || "Atendimento"}
              </p>
            </div>
            <span className="agenda-card-v2__status" data-status={appointment.status}>
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
          </div>

          <div
            aria-hidden="true"
            style={{
              height: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,.06)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${Math.min((Math.abs(swipe.distance) / threshold) * 100, 100)}%`,
                height: "100%",
                background: swipe.distance >= 0 ? "var(--status-success)" : "var(--status-danger)",
                transition: swipe.isSwipping ? "none" : "width .18s var(--ease-smooth)"
              }}
            />
          </div>

          <div className="agenda-card-v2__actions">
            {/* ALTERACAO: fallback explicito por botoes para desktop e usuarios que nao usam swipe. */}
            <button className="agenda-card-v2__button" type="button" onClick={() => onAdvanceStatus?.(appointment)}>
              Avancar status
            </button>
            <button className="agenda-card-v2__button agenda-card-v2__button--danger" type="button" onClick={() => onCancel?.(appointment)}>
              Cancelar
            </button>
            <button className="agenda-card-v2__button" type="button" onClick={() => onOpenWhatsapp?.(appointment)}>
              WhatsApp
            </button>
          </div>
        </div>
      </article>
    </>
  );
}
