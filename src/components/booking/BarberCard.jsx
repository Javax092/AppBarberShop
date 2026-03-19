function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveBarberPhoto(barber) {
  if (barber.photoUrl) {
    return barber.photoUrl;
  }

  if (barber.photoKey === "editorial") {
    return "/moicano.jpeg";
  }

  if (barber.photoKey === "heritage") {
    return "/ash.jpeg";
  }

  return "";
}

export function BarberCard({
  barber,
  selected = false,
  statusTone = "available",
  statusLabel = "",
  onClick,
  loading = false
}) {
  const photoUrl = resolveBarberPhoto(barber);

  return (
    <>
      <style>{`
        /* ALTERACAO: card de barbeiro com avatar real, chip de disponibilidade e estado selecionado premium. */
        .barber-card-v3 {
          width: 100%;
          display: grid;
          gap: 14px;
          padding: 18px;
          text-align: left;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 20%),
            var(--surface-elevated);
          box-shadow: var(--shadow-soft);
          color: var(--text-primary);
          cursor: pointer;
          transition: transform 200ms var(--ease-snap), border-color 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), background 200ms var(--ease-smooth);
        }

        .barber-card-v3:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .barber-card-v3[data-selected="true"] {
          border-width: 2px;
          border-color: var(--color-gold);
          background:
            linear-gradient(180deg, rgba(201, 168, 76, 0.08), rgba(201, 168, 76, 0.04)),
            var(--surface-elevated);
        }

        .barber-card-v3__top {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 14px;
          align-items: center;
        }

        .barber-card-v3__avatar,
        .barber-card-v3__skeleton-avatar {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          overflow: hidden;
          flex: 0 0 auto;
        }

        .barber-card-v3__avatar {
          display: grid;
          place-items: center;
          border: 2px solid var(--color-gold);
          background: var(--color-gold);
          color: var(--color-dark);
          font-weight: 800;
        }

        .barber-card-v3__avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .barber-card-v3__name {
          margin: 0;
          font-size: 1.05rem;
        }

        .barber-card-v3__role,
        .barber-card-v3__hours,
        .barber-card-v3__copy {
          margin: 0;
          color: var(--text-secondary);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          line-height: 1.5;
        }

        .barber-card-v3__status {
          width: fit-content;
          min-height: 28px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: clamp(0.7rem, 1.2vw, 0.75rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
        }

        .barber-card-v3__status[data-tone="available"] {
          color: #7fe1a0;
        }

        .barber-card-v3__status[data-tone="upcoming"] {
          color: #f0c472;
        }

        .barber-card-v3--loading {
          cursor: default;
        }

        .barber-card-v3__line,
        .barber-card-v3__skeleton-avatar {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.07);
        }

        .barber-card-v3__line::after,
        .barber-card-v3__skeleton-avatar::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>

      <button
        className={`barber-card-v3 ${loading ? "barber-card-v3--loading" : ""}`}
        data-selected={selected}
        type="button"
        aria-pressed={selected}
        aria-label={loading ? "Carregando barbeiro" : `Selecionar barbeiro ${barber?.name ?? ""}`}
        onClick={loading ? undefined : onClick}
      >
        {loading ? (
          <>
            <div className="barber-card-v3__top" aria-hidden="true">
              <div className="barber-card-v3__skeleton-avatar" />
              <div style={{ display: "grid", gap: 8 }}>
                <div className="barber-card-v3__line" style={{ width: "70%", height: 14, borderRadius: 999 }} />
                <div className="barber-card-v3__line" style={{ width: "52%", height: 12, borderRadius: 999 }} />
              </div>
            </div>
            <div className="barber-card-v3__line" style={{ width: "44%", height: 28, borderRadius: 999 }} />
            <div className="barber-card-v3__line" style={{ width: "84%", height: 12, borderRadius: 999 }} />
            <div className="barber-card-v3__line" style={{ width: "58%", height: 12, borderRadius: 999 }} />
          </>
        ) : (
          <>
            <div className="barber-card-v3__top">
              <div className="barber-card-v3__avatar" aria-hidden="true">
                {photoUrl ? <img src={photoUrl} alt="" /> : getInitials(barber.name)}
              </div>
              <div>
                <strong className="barber-card-v3__name">{barber.name}</strong>
                <p className="barber-card-v3__role">{barber.role || barber.specialty}</p>
              </div>
            </div>
            {statusLabel ? (
              <span className="barber-card-v3__status" data-tone={statusTone}>
                {statusLabel}
              </span>
            ) : null}
            <p className="barber-card-v3__copy">{barber.specialty}</p>
            <p className="barber-card-v3__hours">
              {barber.workingHours?.start} - {barber.workingHours?.end}
            </p>
          </>
        )}
      </button>
    </>
  );
}
