export function TimeSlotGrid({
  slots = [],
  selectedValue = "",
  onSelect,
  ariaLabel = "Horarios disponiveis"
}) {
  return (
    <>
      <style>{`
        /* ALTERACAO: grid responsivo de slots com staggered animation e estados acessiveis. */
        .time-slot-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-2);
        }

        .time-slot-grid__item {
          min-height: 48px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-soft);
          background: var(--surface-elevated);
          color: var(--text-primary);
          font: inherit;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          animation: fadeUp .34s var(--ease-smooth) both;
          transition: transform .2s var(--ease-snap), border-color .2s var(--ease-smooth), background .2s var(--ease-smooth);
        }

        .time-slot-grid__item[data-state="available"] {
          background: rgba(255,255,255,.03);
        }

        .time-slot-grid__item[data-state="occupied"] {
          color: var(--text-tertiary);
          background: rgba(255,255,255,.02);
          text-decoration: line-through;
          cursor: not-allowed;
        }

        .time-slot-grid__item[data-state="selected"] {
          border-color: var(--border-strong);
          background: linear-gradient(180deg, rgba(240,196,114,.18), rgba(198,145,55,.1));
          box-shadow: var(--shadow-glow);
        }

        .time-slot-grid__item:focus-visible {
          outline: 2px solid var(--color-gold-light);
          outline-offset: 2px;
        }

        @media (min-width: 1024px) {
          .time-slot-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
        }
      `}</style>

      <div className="time-slot-grid" role="grid" aria-label={ariaLabel}>
        {slots.map((slot, index) => {
          // ALTERACAO: normaliza os 3 estados visuais do slot para leitura rapida.
          const state = slot.disabled ? "occupied" : selectedValue === slot.value ? "selected" : "available";

          return (
            <button
              key={slot.value}
              className="time-slot-grid__item"
              type="button"
              role="gridcell"
              aria-label={`Horario ${slot.value} ${slot.disabled ? "ocupado" : "disponivel"}`}
              aria-pressed={selectedValue === slot.value}
              disabled={slot.disabled}
              data-state={state}
              // ALTERACAO: entrada em cascata para reforcar percepcao de performance.
              style={{ animationDelay: `${index * 36}ms` }}
              onClick={() => onSelect?.(slot.value)}
            >
              {slot.value}
            </button>
          );
        })}
      </div>
    </>
  );
}
