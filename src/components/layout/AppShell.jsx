import { useMemo } from "react";

const NAV_ITEMS = [
  // ALTERACAO: icones inline para evitar dependencias extras e manter PWA leve.
  {
    id: "booking",
    label: "Reserva",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    )
  },
  {
    id: "services",
    label: "Servicos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l10 10M14 6l4 4M6 14l4 4M8.5 5.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Zm7 8a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Z" />
      </svg>
    )
  },
  {
    id: "panel",
    label: "Painel",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z" />
      </svg>
    )
  },
  {
    id: "crm",
    label: "Clientes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 19a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 7a5 5 0 0 0-4-4.87M17 4.13A4 4 0 0 1 17 12" />
      </svg>
    )
  }
];

export function AppShell({
  activeItem = "booking",
  brandName = "O Pai Ta On",
  subtitle = "Barbearia premium mobile-first",
  onNavigate,
  items = NAV_ITEMS,
  headerAction = null,
  children
}) {
  // ALTERACAO: fallback dos itens para manter consistencia entre mobile e desktop.
  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        icon: item.icon ?? NAV_ITEMS.find((navItem) => navItem.id === item.id)?.icon ?? NAV_ITEMS[0].icon
      })),
    [items]
  );

  return (
    <>
      <style>{`
        /* ALTERACAO: shell premium mobile-first com header fixo, bottom nav e sidebar desktop. */
        .ops-shell {
          min-height: 100vh;
          color: var(--text-primary);
          background:
            radial-gradient(circle at top, rgba(198, 145, 55, 0.14), transparent 32%),
            linear-gradient(180deg, rgba(18, 13, 9, 0.98), rgba(18, 13, 9, 0.92));
        }

        .ops-shell__header {
          position: sticky;
          top: 0;
          z-index: var(--z-header);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding:
            calc(var(--space-4) + env(safe-area-inset-top))
            var(--space-4)
            var(--space-4);
          background: rgba(18, 13, 9, 0.78);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border-soft);
        }

        .ops-shell__brand {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-width: 0;
        }

        .ops-shell__logo {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: var(--color-gold-light);
          border: 1px solid var(--border-strong);
          background: linear-gradient(180deg, rgba(240, 196, 114, 0.18), rgba(255, 255, 255, 0.04));
          box-shadow: var(--shadow-glow);
          flex: 0 0 auto;
        }

        .ops-shell__logo svg,
        .ops-shell__nav-icon svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .ops-shell__title {
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          line-height: var(--leading-tight);
          letter-spacing: var(--tracking-tight);
        }

        .ops-shell__subtitle {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: var(--leading-normal);
        }

        .ops-shell__pills {
          display: none;
          gap: var(--space-2);
          padding: var(--space-1);
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }

        .ops-shell__pill,
        .ops-shell__bottom-item,
        .ops-shell__sidebar-item {
          min-height: 48px;
          border: 0;
          cursor: pointer;
          font: inherit;
          color: inherit;
          background: transparent;
          transition: transform .22s var(--ease-snap), background .22s var(--ease-smooth), color .22s var(--ease-smooth);
        }

        .ops-shell__pill {
          padding: 0 var(--space-4);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
        }

        .ops-shell__pill[aria-current="page"] {
          background: linear-gradient(180deg, rgba(240, 196, 114, 0.24), rgba(198, 145, 55, 0.12));
          color: var(--color-cream);
        }

        .ops-shell__layout {
          display: block;
          padding: var(--space-4);
          padding-bottom: calc(88px + env(safe-area-inset-bottom));
        }

        .ops-shell__content {
          width: min(100%, 78rem);
          margin: 0 auto;
          animation: fadeUp .42s var(--ease-smooth);
        }

        .ops-shell__bottom {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: var(--z-navigation);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
          background: rgba(18, 13, 9, 0.84);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-soft);
        }

        .ops-shell__bottom-item,
        .ops-shell__sidebar-item {
          display: grid;
          justify-items: center;
          align-content: center;
          gap: var(--space-1);
          padding: var(--space-2);
          border-radius: var(--radius-lg);
          color: var(--text-tertiary);
        }

        .ops-shell__bottom-item[aria-current="page"],
        .ops-shell__sidebar-item[aria-current="page"] {
          color: var(--color-cream);
          background: rgba(240, 196, 114, 0.1);
        }

        .ops-shell__nav-label {
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-wide);
          text-transform: uppercase;
        }

        .ops-shell__sidebar {
          display: none;
        }

        .ops-shell__pill:focus-visible,
        .ops-shell__bottom-item:focus-visible,
        .ops-shell__sidebar-item:focus-visible {
          outline: 2px solid var(--color-gold-light);
          outline-offset: 2px;
        }

        @media (min-width: 1024px) {
          /* ALTERACAO: sidebar fixa em desktop reaproveitando os mesmos itens da bottom nav. */
          .ops-shell__header {
            padding-left: var(--space-6);
            padding-right: var(--space-6);
          }

          .ops-shell__pills {
            display: inline-flex;
          }

          .ops-shell__layout {
            display: grid;
            grid-template-columns: 18rem minmax(0, 1fr);
            gap: var(--space-6);
            max-width: 86rem;
            margin: 0 auto;
            padding: var(--space-6);
          }

          .ops-shell__sidebar {
            position: sticky;
            top: calc(100px + env(safe-area-inset-top));
            display: grid;
            align-content: start;
            gap: var(--space-3);
            height: fit-content;
            padding: var(--space-4);
            border: 1px solid var(--border-soft);
            border-radius: var(--radius-xl);
            background: var(--surface-elevated);
            box-shadow: var(--shadow-md);
          }

          .ops-shell__sidebar-item {
            grid-template-columns: 20px 1fr;
            justify-items: start;
            padding: var(--space-3) var(--space-4);
          }

          .ops-shell__bottom {
            display: none;
          }
        }
      `}</style>

      <div className="ops-shell" data-no-pull-refresh="true">
        <header className="ops-shell__header" role="banner">
          <div className="ops-shell__brand">
            <div className="ops-shell__logo" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 18c3.5-1 4-5.5 7-8.5S18 7 19 3c1 3-1 7-4 10s-7.5 3.5-8.5 7c-1.5-.5-2.5-1.5-3-2Z" />
              </svg>
            </div>
            <div>
              <h1 className="ops-shell__title">{brandName}</h1>
              <p className="ops-shell__subtitle">{subtitle}</p>
            </div>
          </div>

          <nav className="ops-shell__pills" aria-label="Navegacao principal">
            {/* ALTERACAO: pill nav de cabecalho para desktop/tablet. */}
            {normalizedItems.map((item) => (
              <button
                key={item.id}
                className="ops-shell__pill"
                type="button"
                aria-current={activeItem === item.id ? "page" : undefined}
                aria-label={`Abrir ${item.label}`}
                onClick={() => onNavigate?.(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {headerAction}
        </header>

        <div className="ops-shell__layout">
          <aside className="ops-shell__sidebar" aria-label="Atalhos da operacao">
            {/* ALTERACAO: sidebar desktop com os mesmos atalhos da navegacao mobile. */}
            {normalizedItems.map((item) => (
              <button
                key={item.id}
                className="ops-shell__sidebar-item"
                type="button"
                aria-current={activeItem === item.id ? "page" : undefined}
                aria-label={`Abrir ${item.label}`}
                onClick={() => onNavigate?.(item.id)}
              >
                <span className="ops-shell__nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <main className="ops-shell__content" role="main">
            {children}
          </main>
        </div>

        <nav className="ops-shell__bottom" aria-label="Navegacao inferior">
          {/* ALTERACAO: bottom navigation otimizada para thumbs em mobile. */}
          {normalizedItems.map((item) => (
            <button
              key={item.id}
              className="ops-shell__bottom-item"
              type="button"
              aria-current={activeItem === item.id ? "page" : undefined}
              aria-label={`Abrir ${item.label}`}
              onClick={() => onNavigate?.(item.id)}
            >
              <span className="ops-shell__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="ops-shell__nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
