const customLogo = "/paitaon.png";

export function HeroSidebar({ brandConfig }) {
  return (
    <>
      <style>{`
        /* CORRECAO: sidebar do hero usa flow normal e class isolada para nao colidir com shells antigos. */
        .hero-sidebar {
          position: relative;
          display: grid;
          gap: 16px;
          align-content: start;
          min-width: 0;
        }

        .hero-sidebar__card {
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 28px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          box-shadow: var(--shadow-md);
        }

        .hero-sidebar__brand {
          display: grid;
          gap: 12px;
        }

        .hero-sidebar__logo {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 24px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-raised);
        }

        .hero-sidebar__brand h1,
        .hero-sidebar__brand p {
          margin: 0;
        }

        .hero-sidebar__brand h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.9;
          color: var(--text-primary);
        }

        .hero-sidebar__tagline {
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .hero-sidebar__pill {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 16px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-strong);
          background: var(--bg-raised);
          color: var(--text-accent);
          font-size: 0.78rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
      `}</style>

      <aside className="hero-sidebar" aria-label="Resumo da marca">
        <div className="hero-sidebar__card">
          <div className="hero-sidebar__brand">
            <img
              className="hero-sidebar__logo"
              src={brandConfig.logoImageUrl || customLogo}
              alt={brandConfig.logoText || "O Pai Ta On"}
            />
            <div>
              <h1>{brandConfig.heroTitle || brandConfig.logoText || "O Pai Ta On"}</h1>
              <p className="hero-sidebar__tagline">Barbearia premium, agenda precisa e operacao mobile-first</p>
            </div>
          </div>
          <span className="hero-sidebar__pill">Reservas</span>
        </div>
      </aside>
    </>
  );
}
