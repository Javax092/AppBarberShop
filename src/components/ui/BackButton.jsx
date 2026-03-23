// ALTERACAO: componente reutilizavel de retorno com sticky mobile e alvo de toque adequado.
export function BackButton({ onClick, label = "Início" }) {
  return (
    <>
      <style>{`
        .back-btn-wrapper {
          margin-bottom: 24px;
        }

        .back-btn {
          min-height: 48px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.2;
          transition: all 0.2s;
        }

        .back-btn:hover,
        .back-btn:focus-visible {
          color: var(--text-primary);
          border-color: var(--border-strong);
          background: var(--bg-raised);
          outline: none;
        }

        @media (max-width: 1023px) {
          .back-btn-wrapper {
            position: sticky;
            top: 0;
            z-index: var(--z-sticky, 10);
            background: var(--bg-page);
            padding: 12px 16px;
            margin: 0 -16px 16px;
            border-bottom: 1px solid var(--border-hairline);
          }
        }
      `}</style>

      <div className="back-btn-wrapper">
        <button className="back-btn" onClick={onClick} type="button" aria-label={`Voltar para ${label}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {label}
        </button>
      </div>
    </>
  );
}
