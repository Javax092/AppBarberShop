const roleLabels = {
  client: "Cliente",
  barber: "Barbeiro",
  admin: "Admin"
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function HeroAuth({
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
  themeMode,
  onToggleTheme,
  canInstallApp,
  onInstallApp
}) {
  const authMetrics = [
    { id: "total", label: "Reservas", value: Number(adminStats.total ?? 0) },
    { id: "confirmed", label: "Confirmadas", value: Number(adminStats.confirmed ?? 0) },
    { id: "ticket", label: "Ticket medio", value: `R$ ${Math.round(Number(adminStats.averageTicket ?? 0)).toLocaleString("pt-BR")}` }
  ];

  return (
    <>
      <style>{`
        .hero-auth {
          position: relative;
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .hero-auth__metrics {
          display: grid;
          gap: 10px;
        }

        .hero-auth__metric {
          display: grid;
          gap: 6px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-raised);
          box-shadow: var(--shadow-soft);
        }

        .hero-auth__metric span {
          color: var(--text-secondary);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-auth__metric strong {
          color: var(--text-primary);
          font-size: 1.15rem;
        }

        .hero-auth__card {
          position: relative;
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 28px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          box-shadow: var(--shadow-md);
        }

        .hero-auth__head,
        .hero-auth__actions,
        .hero-auth__form {
          display: grid;
          gap: 12px;
        }

        .hero-auth__head h3,
        .hero-auth__head p,
        .hero-auth__card small {
          margin: 0;
        }

        .hero-auth__head p,
        .hero-auth__card small {
          color: var(--text-secondary);
        }

        .hero-auth__pill {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-strong);
          background: var(--bg-raised);
          color: var(--text-accent);
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero-auth__form input {
          width: 100%;
        }

        .hero-auth__primary,
        .hero-auth__secondary {
          width: 100%;
          min-height: 44px;
          border-radius: 16px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }

        .hero-auth__primary {
          border: 1px solid var(--border-strong);
          background: var(--text-accent);
          color: var(--text-on-accent);
        }

        .hero-auth__secondary {
          border: 1px solid var(--border-subtle);
          background: var(--bg-raised);
          color: var(--text-primary);
        }

        .hero-auth__actions {
          grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
        }

        .hero-auth__divider {
          height: 1px;
          background: var(--border-subtle);
        }

        .hero-auth__primary svg,
        .hero-auth__secondary svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      <aside className="hero-auth" aria-label="Acesso da equipe">
        <div className="hero-auth__metrics">
          {authMetrics.map((metric) => (
            <div key={metric.id} className="hero-auth__metric">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>

        <div className="hero-auth__card">
          {session ? (
            <>
              <div className="hero-auth__head">
                <span className="hero-auth__pill">{roleLabels[session.role]}</span>
                <h3>{session.fullName}</h3>
                <p>{session.email}</p>
              </div>
              <button className="hero-auth__secondary" onClick={onLogout} type="button">
                Sair
              </button>
            </>
          ) : isRecoveryMode ? (
            <>
              <div className="hero-auth__head">
                <span className="hero-auth__pill">Recuperacao</span>
                <h3>Acesso da equipe</h3>
                <p>Defina a nova senha para voltar ao painel.</p>
              </div>
              <form className="hero-auth__form" onSubmit={onFinishRecovery}>
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={recoveryPassword}
                  onChange={(event) => onRecoveryPasswordChange(event.target.value)}
                />
                <button className="hero-auth__primary" type="submit" disabled={isFinishingRecovery}>
                  {isFinishingRecovery ? "Atualizando..." : "Definir nova senha"}
                  <ArrowIcon />
                </button>
                {passwordResetFeedback ? <small>{passwordResetFeedback}</small> : null}
              </form>
            </>
          ) : (
            <>
              <div className="hero-auth__head">
                <span className="hero-auth__pill">Equipe</span>
                <h3>Acesso da equipe</h3>
                <p>Entre no painel operacional ou envie o link de recuperacao.</p>
              </div>

              <form className="hero-auth__form" onSubmit={onLogin}>
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
                <button className="hero-auth__primary" type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Entrando..." : "Entrar"}
                  <ArrowIcon />
                </button>
                {authError ? <small>{authError}</small> : null}
              </form>

              <div className="hero-auth__divider" />

              <form className="hero-auth__form" onSubmit={onRequestPasswordReset}>
                <input
                  type="email"
                  placeholder="Email para recuperar senha"
                  value={recoveryEmail}
                  onChange={(event) => onRecoveryEmailChange(event.target.value)}
                />
                <button className="hero-auth__secondary" type="submit" disabled={isRequestingPasswordReset}>
                  {isRequestingPasswordReset ? "Enviando..." : "Enviar link"}
                </button>
                {passwordResetFeedback ? <small>{passwordResetFeedback}</small> : null}
              </form>
            </>
          )}

          <div className="hero-auth__actions">
            {canInstallApp ? (
              <button className="hero-auth__secondary" onClick={onInstallApp} type="button">
                Instalar app
              </button>
            ) : null}
            <button className="hero-auth__secondary" onClick={onToggleTheme} type="button">
              {themeMode === "dark" ? "Modo claro" : "Modo escuro"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
