import { useEffect, useMemo, useState } from "react";

// ALTERACAO: copies premium com fallback local quando a marca nao define uma descricao customizada.
const HERO_COPIES = [
  "Agenda inteligente. Atendimento de referencia. Uma barbearia que respeita o seu tempo e cuida da sua imagem com precisao.",
  "Cada corte e uma declaracao. Agende com quem entende do seu estilo e saia pronto para qualquer ocasiao.",
  "Sem espera, sem surpresa. Escolha seu barbeiro, reserve seu horario e receba confirmacao na hora pelo WhatsApp.",
  "O seu visual comeca aqui. Profissionais que leem seu estilo e entregam mais do que um corte."
];

const roleLabels = {
  client: "Cliente",
  barber: "Barbeiro",
  admin: "Admin"
};

function getInitials(value) {
  return String(value || "OP")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatWhatsapp(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return digits;
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

// CORRECAO: animacao progressiva das metricas com requestAnimationFrame para entrada premium e leitura rapida.
function useCountUp(target, duration = 900) {
  const safeTarget = Number(target ?? 0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let startTime = 0;

    function tick(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const nextValue = Math.round(safeTarget * easeOutCubic(progress));
      setValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    setValue(0);
    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [duration, safeTarget]);

  return value;
}

function MetricCard({ label, value, accent = false, prefix = "" }) {
  const animatedValue = useCountUp(value);
  const formattedValue = prefix
    ? `${prefix}${animatedValue.toLocaleString("pt-BR")}`
    : animatedValue.toLocaleString("pt-BR");

  return (
    <article className="hero-metric-card">
      <strong className={`hero-metric-value${accent ? " is-accent" : ""}`}>{formattedValue}</strong>
      <span className="hero-metric-label">{label}</span>
    </article>
  );
}

function BarberPlaceholder() {
  return (
    <div className="hero-phone-placeholder" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M20 19c0-6.627 5.373-12 12-12s12 5.373 12 12v4.451c3.521 1.902 6 5.63 6 9.929V40c0 1.657-1.343 3-3 3h-4.109a11 11 0 0 1-21.782 0H17c-1.657 0-3-1.343-3-3v-6.62c0-4.299 2.479-8.027 6-9.929V19Zm6 0v3h12v-3a6 6 0 1 0-12 0Zm-6 14.38V37h4v-6h-3.118A6.995 6.995 0 0 0 20 33.38ZM32 49a5 5 0 0 0 4.899-4h-9.798A5 5 0 0 0 32 49Zm8-12h4v-6h-16v6h12Zm10-3.62A6.995 6.995 0 0 0 43.118 31H40v6h4v-3.62Z" />
      </svg>
    </div>
  );
}

export function HeroSection(props) {
  const {
    brandConfig = {},
    selectedBarber,
    adminStats = {},
    queuedNotifications = [],
    session,
    loginForm = { email: "", password: "" },
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
    onViewChange,
    loading = false,
    // ALTERACAO: role explicito controla a visibilidade das metricas no hero.
    role = "guest"
  } = props;

  const featuredBarber = selectedBarber;
  const businessWhatsapp = formatWhatsapp(brandConfig.businessWhatsapp);
  const logoLabel = brandConfig.logoText || brandConfig.heroTitle || "O Pai Ta On";
  const barberName = featuredBarber?.name || "Atendimento de assinatura";
  const barberSpecialty =
    featuredBarber?.specialty || featuredBarber?.heroTagline || "Corte, barba e acabamento com leitura precisa.";
  const queueCount = Number(adminStats.queueCount ?? queuedNotifications.length ?? 0);
  const todayAppointments = Number(adminStats.todayAppointments ?? adminStats.today ?? 0);
  const todayRevenue = Number(adminStats.todayRevenue ?? 0);
  const loginTitle = session ? "Equipe conectada" : "Acesso da equipe";
  const loginDescription = session
    ? session.email || "Painel operacional disponivel."
    : "Entre no painel ou envie o link de recuperacao.";
  // ALTERACAO: brandConfig continua prioritario; fallback usa a copy premium padrao.
  const heroDesc = brandConfig?.heroDescription?.trim() || HERO_COPIES[0];
  const canViewMetrics = role === "admin" || role === "barber";

  const heroMetrics = useMemo(
    () => [
      { id: "today", label: "hoje", value: todayAppointments, accent: false, prefix: "" },
      { id: "revenue", label: "faturamento", value: todayRevenue, accent: true, prefix: "R$ " },
      { id: "queue", label: "na fila", value: queueCount, accent: false, prefix: "" }
    ],
    [queueCount, todayAppointments, todayRevenue]
  );

  function handleBookingView() {
    onViewChange?.("booking");
  }

  return (
    <>
      {/* CORRECAO: fallbacks locais de contraste garantem legibilidade mesmo antes da migracao completa de tokens globais. */}
      <style>{`
        .hero-shell {
          --hero-bg-input: var(--bg-input, var(--bg-raised));
          --hero-text-tertiary: var(--text-tertiary, var(--text-secondary));
          --hero-text-on-gold: var(--text-on-gold, var(--text-on-accent, var(--bg-card)));
          --hero-border-hairline: var(--border-hairline, var(--border-subtle));
          --hero-border-focus: var(--border-focus, var(--border-strong));
          --hero-accent-hover: var(--text-accent-hover, var(--text-accent));
          display: block;
          min-height: 100dvh;
          background: var(--bg-page);
          color: var(--text-primary);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 220px 1fr 300px;
          min-height: 100dvh;
          width: 100%;
        }

        /* CORRECAO: entrada escalonada evita aparicao simultanea e melhora a primeira leitura do hero. */
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-left,
        .hero-center,
        .hero-right {
          min-width: 0;
        }

        .hero-left {
          animation: heroFadeUp 0.5s ease both;
          animation-delay: 0ms;
          padding: 40px 28px;
          border-right: 1px solid var(--hero-border-hairline);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero-center {
          animation: heroFadeUp 0.5s ease both;
          animation-delay: 100ms;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          overflow: hidden;
          background: radial-gradient(
            ellipse at 50% 30%,
            var(--brand-accent-soft, var(--bg-raised)) 0%,
            transparent 65%
          );
        }

        .hero-right {
          animation: heroFadeUp 0.5s ease both;
          animation-delay: 200ms;
          padding: 40px 28px;
          border-left: 1px solid var(--hero-border-hairline);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-logo-mark,
        .hero-logo-image {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          flex: 0 0 48px;
        }

        .hero-logo-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-raised);
          border: 1.5px solid var(--border-strong);
          color: var(--text-accent);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
        }

        .hero-logo-image {
          display: block;
          object-fit: cover;
          border: 1.5px solid var(--border-strong);
          background: var(--bg-raised);
        }

        .hero-logo-copy {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .hero-logo-name {
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
        }

        .hero-logo-subtitle {
          margin: 0;
          color: var(--hero-text-tertiary);
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .hero-title-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 28px;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-strong);
          background: var(--bg-raised);
          color: var(--text-accent);
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1;
          text-transform: uppercase;
        }

        .hero-title {
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: clamp(2rem, 3vw, 2.8rem);
          font-weight: 700;
          line-height: 1.05;
          text-wrap: balance;
        }

        .hero-description {
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.65;
        }

        .hero-contact-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid var(--hero-border-hairline);
          background: var(--bg-card);
        }

        .hero-contact-label {
          margin: 0;
          color: var(--hero-text-tertiary);
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .hero-contact-value {
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
          word-break: break-word;
        }

        .hero-primary-button,
        .hero-secondary-button,
        .hero-ghost-link {
          font-family: var(--font-body);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            color 0.2s ease,
            opacity 0.2s ease;
        }

        .hero-primary-button {
          width: 100%;
          min-height: 48px;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          background: var(--text-accent);
          color: var(--hero-text-on-gold);
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          cursor: pointer;
        }

        .hero-primary-button:hover:not(:disabled) {
          background: var(--hero-accent-hover);
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .hero-primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hero-phone-frame {
          position: relative;
          width: 220px;
          aspect-ratio: 9 / 19.5;
          border-radius: 32px;
          border: 2px solid var(--border-subtle);
          background: var(--bg-card);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .hero-phone-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .hero-phone-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg-raised), var(--bg-card));
        }

        .hero-phone-placeholder svg {
          width: 64px;
          height: 64px;
          fill: var(--hero-text-tertiary);
        }

        .hero-phone-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, var(--bg-page) 100%);
          opacity: 0.9;
          pointer-events: none;
        }

        .hero-highlight-card {
          position: absolute;
          right: 10px;
          bottom: 14px;
          left: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-card);
          backdrop-filter: blur(8px);
        }

        .hero-highlight-title {
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          line-height: 1.05;
        }

        .hero-highlight-copy {
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 400;
          line-height: 1.5;
        }

        .hero-ghost-link {
          width: fit-content;
          min-height: 24px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--text-accent);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          line-height: 1.2;
          text-transform: uppercase;
          cursor: pointer;
        }

        .hero-ghost-link:hover {
          color: var(--text-primary);
        }

        .hero-metrics-row {
          display: flex;
          gap: 8px;
          width: 100%;
          max-width: 420px;
        }

        .hero-metric-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--hero-border-hairline);
          background: var(--bg-raised);
          transition: border-color 0.2s ease;
        }

        .hero-metric-card:hover {
          border-color: var(--border-strong);
        }

        .hero-metric-value {
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
        }

        .hero-metric-value.is-accent {
          color: var(--text-accent);
        }

        .hero-metric-label {
          color: var(--hero-text-tertiary);
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .hero-auth-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px 20px;
          border-radius: 14px;
          border: 1px solid var(--hero-border-hairline);
          background: var(--bg-card);
        }

        .hero-auth-heading {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hero-auth-title {
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          line-height: 1.05;
        }

        .hero-auth-description,
        .hero-feedback {
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.6;
        }

        .hero-feedback.is-error {
          color: var(--status-danger, var(--text-accent));
        }

        .hero-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hero-input {
          width: 100%;
          min-height: 48px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: var(--hero-bg-input);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 500;
          line-height: 1.4;
          padding: 11px 14px;
          outline: none;
        }

        .hero-input::placeholder {
          color: var(--hero-text-tertiary);
        }

        .hero-input:focus {
          border-color: var(--hero-border-focus);
          box-shadow: 0 0 0 3px var(--brand-accent-soft, var(--bg-raised));
        }

        .hero-secondary-button {
          width: 100%;
          min-height: 48px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
          cursor: pointer;
        }

        .hero-secondary-button:hover:not(:disabled) {
          background: var(--bg-raised);
          border-color: var(--border-strong);
          color: var(--text-primary);
          transform: translateY(-1px);
        }

        .hero-secondary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hero-divider {
          width: 100%;
          border: none;
          border-top: 1px solid var(--hero-border-hairline);
          margin: 0;
        }

        @media (max-width: 1023px) {
          /* CORRECAO: no mobile a ordem muda para narrativa curta, mockup central e auth por ultimo. */
          .hero-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .hero-left {
            order: 1;
            border-right: none;
            border-bottom: 1px solid var(--hero-border-hairline);
          }

          .hero-center {
            order: 2;
          }

          .hero-right {
            order: 3;
            border-left: none;
            border-top: 1px solid var(--hero-border-hairline);
          }

          .hero-phone-frame {
            width: 160px;
          }
        }

        @media (max-width: 480px) {
          .hero-left,
          .hero-center,
          .hero-right {
            padding: 24px 16px;
          }

          .hero-phone-frame {
            width: 140px;
          }

          .hero-metrics-row {
            flex-direction: column;
          }
        }
      `}</style>

      <section className="hero-shell" aria-label="Hero principal">
        {/* CORRECAO: grid real de tres colunas com separacao por borda cria leitura premium e estrutura clara. */}
        <div className="hero-grid">
          {/* CORRECAO: coluna esquerda recebe hierarquia tipografica, contato e CTA claro. */}
          <aside className="hero-left" aria-label="Resumo da marca">
            <div className="hero-logo-row">
              {brandConfig.logoImageUrl ? (
                <img className="hero-logo-image" src={brandConfig.logoImageUrl} alt={logoLabel} />
              ) : (
                <div className="hero-logo-mark" aria-hidden="true">
                  {getInitials(logoLabel)}
                </div>
              )}

              <div className="hero-logo-copy">
                <p className="hero-logo-name">{logoLabel}</p>
                <p className="hero-logo-subtitle">Barbearia premium</p>
              </div>
            </div>

            <div className="hero-title-block">
              <span className="hero-pill">Barbearia</span>
              <h1 className="hero-title">{brandConfig.heroTitle || "O Pai Ta On"}</h1>
              <p className="hero-description">{heroDesc}</p>
            </div>

            {businessWhatsapp ? (
              <div className="hero-contact-card">
                <p className="hero-contact-label">Contato</p>
                <p className="hero-contact-value">{businessWhatsapp}</p>
              </div>
            ) : null}

            <button className="hero-primary-button" type="button" onClick={handleBookingView}>
              Fazer reserva →
            </button>
          </aside>

          {/* CORRECAO: coluna central ganha frame de phone, overlay legivel, destaque real e metricas animadas. */}
          <main className="hero-center" aria-label="Destaque visual">
            <div className="hero-phone-frame">
              {featuredBarber?.photoUrl ? (
                <img className="hero-phone-image" src={featuredBarber.photoUrl} alt={barberName} />
              ) : (
                <BarberPlaceholder />
              )}

              <div className="hero-phone-overlay" />

              <div className="hero-highlight-card">
                <span className="hero-pill">Destaque</span>
                <h2 className="hero-highlight-title">{barberName}</h2>
                <p className="hero-highlight-copy">{barberSpecialty}</p>
                <button className="hero-ghost-link" type="button" onClick={handleBookingView}>
                  Reserva online →
                </button>
              </div>
            </div>

            {/* ALTERACAO: metricas so aparecem para barbeiro ou admin. */}
            {canViewMetrics ? (
              <div className="hero-metrics-row" aria-label="Metricas operacionais">
                {heroMetrics.map((metric) => (
                  <MetricCard
                    key={metric.id}
                    label={metric.label}
                    value={loading ? 0 : metric.value}
                    accent={metric.accent}
                    prefix={metric.prefix}
                  />
                ))}
              </div>
            ) : null}
          </main>

          {/* CORRECAO: coluna direita consolida acesso da equipe com inputs legiveis, separacao real e estados de auth. */}
          <aside className="hero-right" aria-label="Acesso da equipe">
            <div className="hero-auth-card">
              <div className="hero-auth-heading">
                <span className="hero-pill">{session ? roleLabels[session.role] || "Equipe" : "Equipe"}</span>
                <h2 className="hero-auth-title">{isRecoveryMode ? "Recuperar acesso" : loginTitle}</h2>
                <p className="hero-auth-description">
                  {isRecoveryMode ? "Defina a nova senha para voltar ao painel." : loginDescription}
                </p>
              </div>

              {session && !isRecoveryMode ? (
                <>
                  <p className="hero-feedback">{session.fullName || "Equipe ativa"}</p>
                  <button className="hero-primary-button" type="button" onClick={onLogout}>
                    Sair →
                  </button>
                </>
              ) : isRecoveryMode ? (
                <form className="hero-form" onSubmit={onFinishRecovery}>
                  <input
                    className="hero-input"
                    type="password"
                    placeholder="Nova senha"
                    value={recoveryPassword}
                    onChange={(event) => onRecoveryPasswordChange?.(event.target.value)}
                  />
                  <button className="hero-primary-button" type="submit" disabled={isFinishingRecovery}>
                    {isFinishingRecovery ? "Atualizando..." : "Definir nova senha →"}
                  </button>
                  {passwordResetFeedback ? <p className="hero-feedback">{passwordResetFeedback}</p> : null}
                </form>
              ) : (
                <>
                  <form className="hero-form" onSubmit={onLogin}>
                    <input
                      className="hero-input"
                      type="email"
                      placeholder="Email da equipe"
                      value={loginForm.email}
                      onChange={(event) => onLoginFormChange?.("email", event.target.value)}
                    />
                    <input
                      className="hero-input"
                      type="password"
                      placeholder="Senha"
                      value={loginForm.password}
                      onChange={(event) => onLoginFormChange?.("password", event.target.value)}
                    />
                    <button className="hero-primary-button" type="submit" disabled={isAuthenticating}>
                      {isAuthenticating ? "Entrando..." : "Entrar →"}
                    </button>
                    {authError ? <p className="hero-feedback is-error">{authError}</p> : null}
                  </form>

                  <hr className="hero-divider" />

                  <form className="hero-form" onSubmit={onRequestPasswordReset}>
                    <input
                      className="hero-input"
                      type="email"
                      placeholder="Email para recuperar senha"
                      value={recoveryEmail}
                      onChange={(event) => onRecoveryEmailChange?.(event.target.value)}
                    />
                    <button className="hero-secondary-button" type="submit" disabled={isRequestingPasswordReset}>
                      {isRequestingPasswordReset ? "Enviando..." : "Enviar link"}
                    </button>
                    {passwordResetFeedback ? <p className="hero-feedback">{passwordResetFeedback}</p> : null}
                  </form>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

/**
 * Props esperadas:
 * @param {{
 *   brandConfig?: { logoText?: string, logoImageUrl?: string, businessWhatsapp?: string, heroTitle?: string, heroDescription?: string },
 *   selectedBarber?: { name?: string, specialty?: string, heroTagline?: string, photoUrl?: string },
 *   adminStats?: { today?: number, todayAppointments?: number, todayRevenue?: number, queueCount?: number },
 *   queuedNotifications?: Array<unknown>,
 *   session?: { role?: string, fullName?: string, email?: string },
 *   loginForm?: { email?: string, password?: string },
 *   onLoginFormChange?: (field: "email" | "password", value: string) => void,
 *   onLogin?: (event: import("react").FormEvent<HTMLFormElement>) => void,
 *   onLogout?: () => void,
 *   authError?: string,
 *   isAuthenticating?: boolean,
 *   recoveryEmail?: string,
 *   onRecoveryEmailChange?: (value: string) => void,
 *   onRequestPasswordReset?: (event: import("react").FormEvent<HTMLFormElement>) => void,
 *   isRequestingPasswordReset?: boolean,
 *   passwordResetFeedback?: string,
 *   isRecoveryMode?: boolean,
 *   recoveryPassword?: string,
 *   onRecoveryPasswordChange?: (value: string) => void,
 *   onFinishRecovery?: (event: import("react").FormEvent<HTMLFormElement>) => void,
 *   isFinishingRecovery?: boolean,
 *   onViewChange?: (view: string) => void,
 *   loading?: boolean,
 *   role?: "guest" | "barber" | "admin"
 * }} props
 */
