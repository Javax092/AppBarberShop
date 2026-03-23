import { useHomeView } from "../../hooks/useHomeView";

const TOOLTIP_LABELS = {
  guest: "Pagina inicial",
  barber: "Minha agenda",
  admin: "Painel admin"
};

const ARIA_LABELS = {
  guest: "Voltar a pagina inicial",
  barber: "Voltar a minha agenda",
  admin: "Voltar ao painel admin"
};

function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" />
      <path d="M6 15V9h4v6" />
    </svg>
  );
}

export function HomeButton({ role = "guest", onNavigate, currentView, hidden = false }) {
  const homeView = useHomeView(role);

  // ALTERACAO: botao fixo some quando o usuario ja esta no inicio correto ou em fluxo protegido.
  if (currentView === homeView || hidden) {
    return null;
  }

  const tooltipLabel = TOOLTIP_LABELS[role] ?? TOOLTIP_LABELS.guest;
  const ariaLabel = ARIA_LABELS[role] ?? ARIA_LABELS.guest;

  const handleNavigate = () => {
    onNavigate?.(homeView);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleNavigate();
  };

  return (
    <>
      <style>{`
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.7) translateY(8px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .home-button {
          position: fixed;
          right: 20px;
          bottom: 88px;
          z-index: var(--z-sticky, 10);
          width: 48px;
          height: 48px;
          border: 1px solid var(--border-strong);
          border-radius: 50%;
          background: var(--bg-card);
          color: var(--text-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--bg-page) 78%, transparent);
          transition:
            background 0.2s var(--ease-smooth),
            border-color 0.2s var(--ease-smooth),
            color 0.2s var(--ease-smooth),
            transform 0.2s var(--ease-smooth),
            box-shadow 0.2s var(--ease-smooth);
          animation: popIn 0.25s var(--ease-bounce, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
        }

        .home-button:focus-visible {
          outline: 2px solid var(--text-accent);
          outline-offset: 3px;
        }

        .home-button__tooltip {
          display: none;
        }

        @media (hover: hover) and (min-width: 1024px) {
          .home-button:hover {
            background: var(--text-accent);
            border-color: var(--text-accent);
            color: var(--text-on-gold, var(--text-on-accent));
            transform: translateY(-2px);
            box-shadow: 0 6px 20px color-mix(in srgb, var(--text-accent) 30%, transparent);
          }

          .home-button__tooltip {
            position: absolute;
            right: 56px;
            display: block;
            padding: 4px 10px;
            border: 1px solid var(--border-subtle);
            border-radius: 6px;
            background: var(--bg-raised);
            color: var(--text-primary);
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s var(--ease-smooth);
          }

          .home-button:hover .home-button__tooltip,
          .home-button:focus-visible .home-button__tooltip {
            opacity: 1;
          }
        }

        @media (min-width: 1024px) {
          .home-button {
            right: 32px;
            bottom: 32px;
          }
        }
      `}</style>

      <button
        className="home-button"
        type="button"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
      >
        <span className="home-button__tooltip">{tooltipLabel}</span>
        <HomeIcon />
      </button>
    </>
  );
}
