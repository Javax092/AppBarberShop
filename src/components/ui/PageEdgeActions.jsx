export function PageEdgeActions({
  showBack = false,
  onBack,
  showLogout = false,
  onLogout,
  placement = "top"
}) {
  if (!showBack && !showLogout) {
    return null;
  }

  return (
    <>
      <style>{`
        .page-edge-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: ${placement === "top" ? "0 0 20px" : "28px 0 0"};
        }

        .page-edge-actions[data-placement="bottom"] {
          padding-bottom: 12px;
        }

        .page-edge-actions__button {
          min-height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition:
            background 0.2s var(--ease-smooth),
            border-color 0.2s var(--ease-smooth),
            color 0.2s var(--ease-smooth);
        }

        .page-edge-actions__button:hover,
        .page-edge-actions__button:focus-visible {
          background: var(--bg-raised);
          border-color: var(--border-strong);
          outline: none;
        }

        .page-edge-actions__button--danger {
          color: var(--status-danger, #ff7d7d);
        }

        .page-edge-actions__button svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      <div className="page-edge-actions" data-placement={placement}>
        {showBack ? (
          <button className="page-edge-actions__button" type="button" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
            Voltar ao menu principal
          </button>
        ) : null}

        {showLogout ? (
          <button className="page-edge-actions__button page-edge-actions__button--danger" type="button" onClick={onLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
            Sair
          </button>
        ) : null}
      </div>
    </>
  );
}
