function EmptyIllustration() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <path d="M28 16 44 32m0 0-6 6m6-6 8-8m4 40V42a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v22a8 8 0 0 1-8 8H34a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8h12" />
      <path d="M34 48h16m-16 12h24" />
      <circle cx="26" cy="22" r="8" />
      <circle cx="50" cy="46" r="4" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction
}) {
  return (
    <>
      <style>{`
        /* ALTERACAO: estado vazio reutilizavel para agenda e galeria com ilustracao SVG simples. */
        .empty-state {
          display: grid;
          justify-items: center;
          gap: 14px;
          padding: 28px;
          text-align: center;
          border-radius: 28px;
          border: 1px dashed var(--border-strong);
          background:
            radial-gradient(circle at top, rgba(198, 145, 55, 0.08), transparent 46%),
            var(--surface-elevated);
        }

        .empty-state svg {
          width: 72px;
          height: 72px;
          fill: none;
          stroke: var(--color-gold-light);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .empty-state h3,
        .empty-state p {
          margin: 0;
        }

        .empty-state p {
          max-width: 36ch;
          color: var(--text-secondary);
        }

        .empty-state__actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }
      `}</style>

      <div className="empty-state" role="status">
        <EmptyIllustration />
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        <div className="empty-state__actions">
          {actionLabel ? (
            <button className="primary-button compact-button" type="button" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
          {secondaryLabel ? (
            <button className="secondary-button compact-button" type="button" onClick={onSecondaryAction}>
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
