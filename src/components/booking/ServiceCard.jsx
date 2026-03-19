export function ServiceCard({
  name,
  category,
  price,
  duration,
  badge,
  selected = false,
  loading = false,
  onClick
}) {
  return (
    <>
      <style>{`
        /* ALTERACAO: card de servico premium com estado selected e skeleton shimmer. */
        .service-card-v2 {
          position: relative;
          width: 100%;
          min-height: 148px;
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid ${selected ? "var(--border-strong)" : "var(--border-soft)"};
          background:
            linear-gradient(180deg, rgba(240,196,114,.08), transparent 30%),
            var(--surface-elevated);
          box-shadow: ${selected ? "var(--shadow-glow)" : "var(--shadow-soft)"};
          color: var(--text-primary);
          text-align: left;
          overflow: hidden;
          cursor: pointer;
          transition: transform .24s var(--ease-snap), border-color .24s var(--ease-smooth), box-shadow .24s var(--ease-smooth);
        }

        .service-card-v2::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(240,196,114,.0);
          transition: border-color .24s var(--ease-smooth);
        }

        .service-card-v2[data-selected="true"]::after {
          border-color: rgba(240,196,114,.4);
        }

        .service-card-v2:hover,
        .service-card-v2:focus-visible {
          transform: translateY(-2px);
        }

        .service-card-v2:focus-visible {
          outline: 2px solid var(--color-gold-light);
          outline-offset: 2px;
        }

        .service-card-v2__meta {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .service-card-v2__badge,
        .service-card-v2__category {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 var(--space-3);
          border-radius: var(--radius-pill);
          background: rgba(240,196,114,.1);
          color: var(--color-gold-light);
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-caps);
          text-transform: uppercase;
        }

        .service-card-v2 h3 {
          margin: 0 0 var(--space-2);
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          line-height: var(--leading-tight);
          letter-spacing: var(--tracking-tight);
        }

        .service-card-v2__footer {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: var(--space-3);
          margin-top: var(--space-4);
        }

        .service-card-v2__price {
          font-size: var(--text-lg);
          font-weight: 700;
        }

        .service-card-v2__duration {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .service-card-v2--loading {
          cursor: default;
        }

        .service-card-v2--loading::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
          animation: shimmer 1.4s infinite linear;
        }

        .service-card-v2__line {
          height: 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
        }
      `}</style>

      <button
        className={`service-card-v2 ${loading ? "service-card-v2--loading" : ""}`}
        data-selected={selected}
        type="button"
        aria-pressed={selected}
        aria-label={loading ? "Carregando servico" : `Selecionar servico ${name}`}
        onClick={loading ? undefined : onClick}
      >
        {loading ? (
          // ALTERACAO: skeleton para evitar salto visual enquanto os servicos carregam.
          <div aria-hidden="true">
            <div className="service-card-v2__meta">
              <div className="service-card-v2__line" style={{ width: 92 }} />
              <div className="service-card-v2__line" style={{ width: 64 }} />
            </div>
            <div className="service-card-v2__line" style={{ width: "72%", height: 22 }} />
            <div className="service-card-v2__footer">
              <div className="service-card-v2__line" style={{ width: 82 }} />
              <div className="service-card-v2__line" style={{ width: 54 }} />
            </div>
          </div>
        ) : (
          <>
            {/* ALTERACAO: badge de categoria e destaque comercial do servico. */}
            <div className="service-card-v2__meta">
              <span className="service-card-v2__category">{category}</span>
              {badge ? <span className="service-card-v2__badge">{badge}</span> : null}
            </div>
            <h3>{name}</h3>
            <div className="service-card-v2__footer">
              {/* ALTERACAO: resumo objetivo de valor e duracao para decisao rapida no mobile. */}
              <span className="service-card-v2__price">{price}</span>
              <span className="service-card-v2__duration">{duration}</span>
            </div>
          </>
        )}
      </button>
    </>
  );
}
