const DEFAULT_ITEMS = [
  {
    id: "booking",
    label: "Reservas",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    )
  },
  {
    id: "panel",
    label: "Equipe",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 19a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 7a5 5 0 0 0-4-4.87M17 4.13A4 4 0 0 1 17 12" />
      </svg>
    )
  },
  {
    id: "automations",
    label: "Fluxos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h11m0 0-3-3m3 3-3 3M20 17H9m0 0 3-3m-3 3 3 3" />
      </svg>
    )
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12a8 8 0 0 1-11.74 7.04L4 20l.96-4.26A8 8 0 1 1 20 12Z" />
        <path d="M9 10.5c.24 1.54 1.96 3.26 3.5 3.5m-.9-4.3c.18-.6.72-.97 1.3-.87.68.12 1.1.86.82 1.49l-.19.41a1 1 0 0 0 .13 1.01l.11.14c.24.3.2.74-.09.98l-.38.31a1.2 1.2 0 0 1-1.12.21 6.55 6.55 0 0 1-3.72-3.72 1.2 1.2 0 0 1 .21-1.12l.31-.38c.24-.29.68-.33.98-.09l.14.11a1 1 0 0 0 1.01.13l.49-.2Z" />
      </svg>
    )
  },
  {
    id: "admin",
    label: "Gestao",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z" />
      </svg>
    )
  }
];

export function AppShell({
  activeItem = "booking",
  items = DEFAULT_ITEMS,
  brandName = "O Pai Ta On",
  tagline = "Barbearia premium mobile-first",
  onNavigate,
  sidebarFooter = null,
  rightRail = null,
  topSlot = null,
  children
}) {
  const visibleItems = (items.length ? items : DEFAULT_ITEMS).map((item) => ({
    ...item,
    icon: item.icon || DEFAULT_ITEMS.find((defaultItem) => defaultItem.id === item.id)?.icon || DEFAULT_ITEMS[0].icon
  }));

  return (
    <>
      <style>{`
        /* ALTERACAO: shell estrutural do dashboard com sidebar fixa, coluna principal e painel direito sticky. */
        .ops-shell {
          min-height: 100vh;
          color: var(--text-primary);
          background:
            radial-gradient(circle at top left, rgba(198, 145, 55, 0.12), transparent 28%),
            linear-gradient(180deg, rgba(18, 13, 9, 0.98), rgba(18, 13, 9, 0.94));
        }

        .ops-shell__layout {
          width: min(1440px, calc(100% - 24px));
          margin: 0 auto;
          padding: 16px 0 calc(96px + env(safe-area-inset-bottom));
          display: grid;
          gap: 16px;
        }

        .ops-shell__sidebar {
          display: none;
        }

        .ops-shell__hero {
          display: grid;
          gap: 16px;
        }

        .ops-shell__main {
          display: grid;
          gap: 20px;
          min-width: 0;
        }

        .ops-shell__content {
          display: grid;
          gap: 22px;
          min-width: 0;
        }

        .ops-shell__rail {
          display: grid;
          gap: 16px;
        }

        .ops-shell__bottom {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-navigation);
          display: grid;
          grid-template-columns: repeat(${Math.min(visibleItems.length, 5)}, minmax(0, 1fr));
          gap: 8px;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
          background: rgba(18, 13, 9, 0.86);
          backdrop-filter: blur(18px);
          border-top: 1px solid var(--border-soft);
        }

        .ops-shell__nav-item {
          min-height: 56px;
          border: 0;
          border-radius: 18px;
          background: transparent;
          color: var(--text-secondary);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 4px;
          cursor: pointer;
          transition: transform 200ms var(--ease-snap), background 200ms var(--ease-smooth), color 200ms var(--ease-smooth);
        }

        .ops-shell__nav-item:hover {
          transform: translateY(-2px);
        }

        .ops-shell__nav-item[aria-current="page"] {
          background: rgba(198, 145, 55, 0.12);
          color: var(--color-cream);
        }

        .ops-shell__nav-item svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ops-shell__nav-item span:last-child {
          font-size: clamp(0.7rem, 1.2vw, 0.75rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .ops-shell__sidebar-card {
          border: 1px solid var(--border-soft);
          border-radius: 28px;
          background:
            linear-gradient(180deg, rgba(255, 244, 227, 0.05), transparent 18%),
            var(--surface-elevated);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(20px);
        }

        @media (min-width: 1024px) {
          .ops-shell__layout {
            grid-template-columns: 220px minmax(0, 720px) 280px;
            align-items: start;
            gap: 24px;
            padding: 24px 0 48px;
          }

          .ops-shell__sidebar {
            position: sticky;
            top: 0;
            display: grid;
            grid-template-rows: auto 1fr auto;
            min-height: 100vh;
            padding: 24px 18px;
          }

          .ops-shell__sidebar-brand {
            display: grid;
            gap: 6px;
            padding: 18px;
            margin-bottom: 18px;
          }

          .ops-shell__sidebar-brand strong {
            font-family: var(--font-display);
            font-size: 2rem;
            line-height: 0.95;
          }

          .ops-shell__sidebar-brand span {
            font-size: 0.82rem;
            color: var(--color-muted);
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .ops-shell__sidebar-nav {
            display: grid;
            gap: 8px;
            align-content: start;
          }

          .ops-shell__sidebar .ops-shell__nav-item {
            grid-template-columns: 20px 1fr;
            justify-items: start;
            padding: 0 14px;
            border-radius: 20px;
            min-height: 52px;
          }

          .ops-shell__sidebar .ops-shell__nav-item[aria-current="page"] {
            background: rgba(198, 145, 55, 0.12);
            border-left: 3px solid var(--color-gold);
          }

          .ops-shell__sidebar .ops-shell__nav-item span:last-child {
            font-size: 0.8rem;
          }

          .ops-shell__hero,
          .ops-shell__rail {
            position: sticky;
            top: 24px;
            align-self: start;
          }

          .ops-shell__bottom {
            display: none;
          }
        }
      `}</style>

      <div className="ops-shell" data-no-pull-refresh="true">
        <div className="ops-shell__layout">
          <aside className="ops-shell__sidebar ops-shell__sidebar-card" aria-label="Navegacao principal">
            <div className="ops-shell__sidebar-brand">
              <strong>{brandName}</strong>
              <span>{tagline}</span>
            </div>

            <nav className="ops-shell__sidebar-nav">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  className="ops-shell__nav-item"
                  type="button"
                  aria-current={activeItem === item.id ? "page" : undefined}
                  aria-label={`Abrir ${item.label}`}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {sidebarFooter ? <div>{sidebarFooter}</div> : <div />}
          </aside>

          <div className="ops-shell__main">
            {topSlot ? <div className="ops-shell__hero">{topSlot}</div> : null}
            <main className="ops-shell__content" role="main">
              {children}
            </main>
          </div>

          {rightRail ? <aside className="ops-shell__rail">{rightRail}</aside> : <div />}
        </div>

        <nav className="ops-shell__bottom" aria-label="Navegacao inferior">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className="ops-shell__nav-item"
              type="button"
              aria-current={activeItem === item.id ? "page" : undefined}
              aria-label={`Abrir ${item.label}`}
              onClick={() => onNavigate?.(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
