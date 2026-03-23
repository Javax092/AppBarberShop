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

export function BottomNav({ activeView, onViewChange, items = DEFAULT_ITEMS }) {
  const visibleItems = (items.length ? items : DEFAULT_ITEMS).slice(0, 5);

  return (
    <>
      <style>{`
        /* CORRECAO: navegacao mobile extraida do AppShell para nao disputar contexto com o hero. */
        .bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 64px;
          display: grid;
          grid-template-columns: repeat(${Math.max(visibleItems.length, 1)}, minmax(0, 1fr));
          gap: 8px;
          padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
          background: var(--bg-card);
          border-top: 1px solid var(--border-subtle);
          z-index: var(--z-bottomnav);
        }

        .bottom-nav__item {
          min-height: 48px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: var(--text-secondary);
          display: grid;
          justify-items: center;
          align-content: center;
          gap: 4px;
          cursor: pointer;
          transition: background 160ms var(--ease-smooth), color 160ms var(--ease-smooth);
        }

        .bottom-nav__item[aria-current="page"] {
          background: var(--bg-raised);
          color: var(--text-primary);
        }

        .bottom-nav__item svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .bottom-nav__item span:last-child {
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        @media (min-width: 1024px) {
          .bottom-nav {
            display: none;
          }
        }
      `}</style>

      <nav className="bottom-nav" aria-label="Navegacao inferior">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            className="bottom-nav__item"
            type="button"
            aria-current={activeView === item.id ? "page" : undefined}
            aria-label={`Abrir ${item.label}`}
            onClick={() => onViewChange?.(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export { DEFAULT_ITEMS as DEFAULT_BOTTOM_NAV_ITEMS };
