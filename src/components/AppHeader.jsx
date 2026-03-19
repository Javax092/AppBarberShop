import { useEffect, useMemo, useState } from "react";
import { MetricSkeleton } from "./ui/Skeleton";

const customLogo = "/paitaon.png";
const phoneVisual = "/degrade.jpeg";

const roleLabels = {
  client: "Cliente",
  barber: "Barbeiro",
  admin: "Admin"
};

const metricIcons = {
  appointments: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M17 7.5c0-1.93-2.24-3.5-5-3.5S7 5.57 7 7.5 9.24 11 12 11s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 19a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  )
};

function easeOutExpo(value) {
  return value === 1 ? 1 : 1 - 2 ** (-10 * value);
}

function AnimatedMetricValue({ value, prefix = "", suffix = "", currency = false }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numericValue = Number(value ?? 0);
    let frameId = 0;
    const startedAt = performance.now();

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - startedAt) / 800, 1);
      const eased = easeOutExpo(progress);
      setDisplayValue(Math.round(numericValue * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  if (currency) {
    return (
      <strong>
        {prefix}
        {displayValue.toLocaleString("pt-BR")}
        {suffix}
      </strong>
    );
  }

  return (
    <strong>
      {prefix}
      {displayValue}
      {suffix}
    </strong>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function AppHeader({
  selectedBarber,
  session,
  loginForm,
  onLoginFormChange,
  onLogin,
  onLogout,
  authError,
  isAuthenticating,
  recoveryEmail,
  onRecoveryEmailChange,
  onRequestPasswordReset,
  isRequestingPasswordReset,
  passwordResetFeedback,
  isRecoveryMode,
  recoveryPassword,
  onRecoveryPasswordChange,
  onFinishRecovery,
  isFinishingRecovery,
  adminStats,
  queuedNotifications,
  brandConfig,
  themeMode,
  onToggleTheme,
  canInstallApp,
  onInstallApp,
  loading = false
}) {
  const metrics = useMemo(
    () => [
      {
        id: "today",
        icon: metricIcons.appointments,
        label: "atendimentos hoje",
        value: Number(adminStats.today ?? 0)
      },
      {
        id: "revenue",
        icon: metricIcons.revenue,
        label: "faturamento do dia",
        value: Number(adminStats.todayRevenue ?? 0),
        prefix: "R$ ",
        currency: true
      },
      session?.role
        ? {
            id: "profile",
            icon: metricIcons.profile,
            label: "perfil conectado",
            textValue: roleLabels[session.role]
          }
        : {
            id: "queue",
            icon: metricIcons.queue,
            label: "mensagens na fila",
            value: Number(queuedNotifications.length ?? 0)
          }
    ],
    [adminStats.today, adminStats.todayRevenue, queuedNotifications.length, session?.role]
  );

  return (
    <>
      <style>{`
        /* ALTERACAO: hero editorial com lockup em flex-row, mockup central e card de equipe separado. */
        .hero-card {
          display: grid;
          gap: 20px;
          padding: 24px;
          border-radius: 34px;
        }

        .hero-card,
        .team-access-card,
        .hero-metrics-grid .stat-card {
          border: 1px solid var(--border-soft);
          background:
            linear-gradient(180deg, rgba(255, 244, 227, 0.05), transparent 18%),
            var(--surface-elevated);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(24px);
        }

        .hero-card__inner {
          display: grid;
          gap: 20px;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand-logo {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          border: 1px solid var(--border-soft);
          object-fit: cover;
          background: rgba(255, 255, 255, 0.04);
        }

        .hero-copy h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 0.9;
          white-space: normal;
        }

        .hero-tagline {
          margin: 6px 0 0;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-copy > p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .hero-visual {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 420px;
          padding: 12px;
        }

        .hero-phone {
          position: relative;
          width: min(100%, 292px);
          aspect-ratio: 9 / 19.5;
          border-radius: 32px;
          border: 2px solid var(--color-smoke);
          overflow: hidden;
          background:
            linear-gradient(160deg, rgba(198, 145, 55, 0.34), rgba(18, 13, 9, 0.9) 44%),
            url("${phoneVisual}") center / cover no-repeat;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
        }

        .hero-phone::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.18), transparent 28%),
            radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 34%);
          pointer-events: none;
        }

        .hero-phone__ui {
          position: absolute;
          inset: 0;
          padding: 24px 18px;
          display: grid;
          align-content: space-between;
        }

        .hero-phone__pill {
          width: fit-content;
          min-height: 28px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero-phone__sheet {
          padding: 18px;
          border-radius: 24px;
          background: rgba(8, 6, 4, 0.52);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          display: grid;
          gap: 8px;
        }

        .hero-phone__sheet strong {
          font-size: 1.05rem;
        }

        .spotlight-card {
          position: absolute;
          left: 50%;
          bottom: 24px;
          width: 80%;
          transform: translateX(-50%);
          display: grid;
          gap: 10px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(9, 7, 5, 0.84);
          backdrop-filter: blur(12px);
        }

        .spotlight-card p,
        .spotlight-card small {
          margin: 0;
          color: var(--text-secondary);
        }

        .hero-metrics-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
        }

        .stat-card {
          display: grid;
          gap: 10px;
          padding: 18px;
          border-radius: 24px;
          transition: border-color 200ms var(--ease-smooth), transform 200ms var(--ease-snap), box-shadow 200ms var(--ease-smooth);
        }

        .stat-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-2px);
          box-shadow: var(--shadow-soft);
        }

        .stat-card__label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: clamp(0.7rem, 1.2vw, 0.75rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stat-card__label svg,
        .team-access-card button svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .stat-card strong {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          color: var(--color-gold-light);
        }

        .team-access-card {
          display: grid;
          gap: 14px;
          padding: 20px;
          border-color: var(--color-gold-border);
          border-radius: 28px;
        }

        .team-access-card__head {
          display: grid;
          gap: 6px;
        }

        .team-access-card__head h3,
        .team-access-card__head p {
          margin: 0;
        }

        .auth-form {
          display: grid;
          gap: 12px;
        }

        .auth-form input {
          width: 100%;
        }

        .team-access-card .primary-button,
        .team-access-card .secondary-button {
          width: 100%;
          justify-content: center;
        }

        .team-access-card .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .team-access-card .secondary-button {
          background: transparent;
          border-color: transparent;
          color: var(--text-secondary);
        }

        .team-access-card .secondary-button:hover {
          border-color: var(--border-soft);
          background: rgba(255,255,255,0.04);
        }

        .auth-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }

        @media (min-width: 900px) {
          .hero-card__inner {
            grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr);
            align-items: center;
          }
        }

        @media (min-width: 1024px) {
          .hero-copy h1 {
            white-space: nowrap;
          }
        }
      `}</style>

      <section className="hero-card">
        <div className="hero-card__inner">
          <div className="hero-copy">
            <div className="brand-lockup">
              <img
                className="brand-logo"
                src={brandConfig.logoImageUrl || customLogo}
                alt={brandConfig.logoText}
              />
              <div>
                <h1>{brandConfig.heroTitle || brandConfig.logoText}</h1>
                <p className="hero-tagline">Barbearia premium, agenda precisa e operacao mobile-first</p>
              </div>
            </div>

            <p>
              {brandConfig.heroDescription ||
                "Uma jornada premium para reservar, operar a agenda da equipe e sustentar a marca com imagem forte em qualquer tela."}
            </p>

            <div className="brand-inline hero-meta">
              <strong>Contato</strong>
              <span>{brandConfig.businessWhatsapp}</span>
            </div>

            <div className="hero-actions">
              {canInstallApp ? (
                <button className="primary-button compact-button" onClick={onInstallApp} type="button">
                  Instalar app
                </button>
              ) : null}
              <button className="secondary-button compact-button" onClick={onToggleTheme} type="button">
                {themeMode === "dark" ? "Modo claro" : "Modo escuro"}
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-phone" aria-label="Preview do app no celular">
              <div className="hero-phone__ui">
                <span className="hero-phone__pill">Agenda premium</span>
                <div className="hero-phone__sheet">
                  <span className="mini-badge">Hoje</span>
                  <strong>{selectedBarber?.name || "Atendimento de assinatura"}</strong>
                  <p>
                    {selectedBarber?.heroTagline ||
                      "Corte, barba e acabamento com leitura profissional em cada detalhe."}
                  </p>
                </div>
              </div>
            </div>

            <div className="spotlight-card">
              <span className="mini-badge">Destaque</span>
              <strong>{selectedBarber?.name || "Experiencia premium"}</strong>
              <p>
                {selectedBarber?.heroTagline ||
                  "Reserva direta, atendimento de presenca e acompanhamento operacional no mesmo fluxo."}
              </p>
              <small>Mockup editorial com foco em conversao mobile</small>
            </div>
          </div>
        </div>

        <div className="hero-metrics-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <MetricSkeleton key={index} />)
            : metrics.map((metric) => (
                <div key={metric.id} className="stat-card">
                  <span className="stat-card__label">
                    {metric.icon}
                    {metric.label}
                  </span>
                  {metric.textValue ? (
                    <strong>{metric.textValue}</strong>
                  ) : (
                    <AnimatedMetricValue
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                      currency={metric.currency}
                    />
                  )}
                </div>
              ))}
        </div>

        <div className="team-access-card">
          {session ? (
            <>
              <div className="team-access-card__head">
                <span className="mini-badge">{roleLabels[session.role]}</span>
                <h3>{session.fullName}</h3>
                <p>{session.email}</p>
              </div>
              <button className="secondary-button compact-button" onClick={onLogout} type="button">
                Sair
              </button>
            </>
          ) : isRecoveryMode ? (
            <>
              <div className="team-access-card__head">
                <span className="mini-badge">Recuperacao</span>
                <h3>Acesso da equipe</h3>
                <p>Defina a nova senha para voltar ao painel.</p>
              </div>
              <form className="auth-form" onSubmit={onFinishRecovery}>
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={recoveryPassword}
                  onChange={(event) => onRecoveryPasswordChange(event.target.value)}
                />
                <button className="primary-button compact-button" type="submit" disabled={isFinishingRecovery}>
                  {isFinishingRecovery ? "Atualizando..." : "Definir nova senha"}
                  <ArrowIcon />
                </button>
                {passwordResetFeedback ? <small>{passwordResetFeedback}</small> : null}
              </form>
            </>
          ) : (
            <>
              <div className="team-access-card__head">
                <span className="mini-badge">Equipe</span>
                <h3>Acesso da equipe</h3>
                <p>Entre no painel operacional ou envie o link de recuperacao.</p>
              </div>

              <form className="auth-form" onSubmit={onLogin}>
                <input
                  type="email"
                  placeholder="Email da equipe"
                  value={loginForm.email}
                  onChange={(event) => onLoginFormChange("email", event.target.value)}
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={loginForm.password}
                  onChange={(event) => onLoginFormChange("password", event.target.value)}
                />
                <button className="primary-button compact-button" type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Entrando..." : "Entrar"}
                  <ArrowIcon />
                </button>
                {authError ? <small>{authError}</small> : null}
              </form>

              <div className="auth-divider" />

              <form className="auth-form" onSubmit={onRequestPasswordReset}>
                <input
                  type="email"
                  placeholder="Email para recuperar senha"
                  value={recoveryEmail}
                  onChange={(event) => onRecoveryEmailChange(event.target.value)}
                />
                <button
                  className="secondary-button compact-button"
                  type="submit"
                  disabled={isRequestingPasswordReset}
                >
                  {isRequestingPasswordReset ? "Enviando..." : "Enviar link"}
                </button>
                {passwordResetFeedback ? <small>{passwordResetFeedback}</small> : null}
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
