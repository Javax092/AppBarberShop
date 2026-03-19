import { useEffect, useState } from "react";

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

export function NetworkBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <>
      <style>{`
        /* ALTERACAO: banner de rede persistente no topo enquanto offline, sem comportamento de toast. */
        .network-banner {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 141, 132, 0.2);
          background: var(--color-error-bg, rgba(255, 141, 132, 0.12));
          color: var(--text-primary);
          font-size: 0.82rem;
        }

        .network-banner svg {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          animation: networkSpin 0.9s linear infinite;
        }

        @keyframes networkSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="network-banner" role="status" aria-live="polite">
        <Spinner />
        <span>Sem conexao — tentando reconectar...</span>
      </div>
    </>
  );
}
