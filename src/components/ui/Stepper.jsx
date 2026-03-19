function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

export function Stepper({ steps, currentStep = 0, onStepChange }) {
  return (
    <>
      <style>{`
        /* ALTERACAO: stepper conectado com linha progressiva, estado atual pulsante e acessibilidade por aria-current. */
        .stepper {
          position: relative;
          display: grid;
          grid-template-columns: repeat(var(--step-count), minmax(0, 1fr));
          gap: 10px;
          padding: 10px 0 18px;
        }

        .stepper__item {
          position: relative;
          display: grid;
          justify-items: center;
          gap: 8px;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
          padding: 0;
          min-height: 64px;
          cursor: pointer;
        }

        .stepper__item::before {
          content: "";
          position: absolute;
          top: 21px;
          left: calc(-50% + 26px);
          width: calc(100% - 4px);
          height: 1px;
          background: var(--color-smoke);
          opacity: 0.45;
        }

        .stepper__item:first-child::before {
          display: none;
        }

        .stepper__item[data-state="done"]::before,
        .stepper__item[data-state="current"]::before {
          background: linear-gradient(90deg, var(--color-gold), var(--color-smoke));
          opacity: 1;
        }

        .stepper__disc {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          background: rgba(255, 255, 255, 0.03);
          display: grid;
          place-items: center;
          font-weight: 700;
          transition: transform 200ms var(--ease-snap), border-color 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), color 200ms var(--ease-smooth);
        }

        .stepper__item[data-state="future"] .stepper__disc {
          color: var(--color-muted);
        }

        .stepper__item[data-state="done"] .stepper__disc {
          color: var(--color-gold);
          border-color: rgba(198, 145, 55, 0.4);
          background: rgba(198, 145, 55, 0.1);
        }

        .stepper__item[data-state="done"] .stepper__disc svg,
        .stepper__item[data-state="current"] .stepper__disc svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .stepper__item[data-state="current"] .stepper__disc {
          border-color: var(--color-gold);
          color: var(--color-cream);
          box-shadow: 0 0 0 6px rgba(198, 145, 55, 0.12);
          animation: stepperPulse 1.4s ease-in-out infinite;
        }

        .stepper__label {
          font-size: clamp(0.7rem, 1.2vw, 0.75rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
        }

        @keyframes stepperPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(198, 145, 55, 0.18);
          }

          50% {
            box-shadow: 0 0 0 8px rgba(198, 145, 55, 0.06);
          }
        }
      `}</style>

      <div className="stepper" role="list" style={{ "--step-count": steps.length }}>
        {steps.map((step, index) => {
          const isDone = step.complete || index < currentStep;
          const isCurrent = currentStep === index;
          const state = isDone ? "done" : isCurrent ? "current" : "future";

          return (
            <button
              key={step.id}
              className="stepper__item"
              data-state={state}
              type="button"
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Passo ${index + 1}: ${step.label}`}
              onClick={() => onStepChange?.(index)}
            >
              <span className="stepper__disc">{isDone ? <CheckIcon /> : index + 1}</span>
              <span className="stepper__label">{step.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
