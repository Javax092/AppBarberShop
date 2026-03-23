const phoneVisual = "/degrade.jpeg";

function formatMetricValue(value, { prefix = "", currency = false } = {}) {
  const numericValue = Number(value ?? 0);

  if (currency) {
    return `${prefix}${numericValue.toLocaleString("pt-BR")}`;
  }

  return `${prefix}${numericValue}`;
}

export function HeroVisual({ selectedBarber, adminStats, queuedNotifications, loading = false }) {
  const metrics = [
    { id: "today", label: "Atendimentos", value: formatMetricValue(adminStats.today) },
    { id: "revenue", label: "Faturamento", value: formatMetricValue(adminStats.todayRevenue, { prefix: "R$ ", currency: true }) },
    { id: "messages", label: "Mensagens", value: formatMetricValue(queuedNotifications.length) }
  ];

  return (
    <>
      <style>{`
        .hero-visual {
          position: relative;
          display: grid;
          gap: 16px;
          align-content: start;
          min-width: 0;
        }

        .hero-visual__frame {
          display: grid;
          justify-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 32px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          box-shadow: var(--shadow-md);
        }

        /* CORRECAO: o unico contexto absoluto fica preso ao wrapper relativo do mockup. */
        .hero-visual__phone-shell {
          position: relative;
          width: 100%;
          display: grid;
          justify-items: center;
        }

        .hero-visual__phone {
          position: relative;
          width: 100%;
          max-width: 260px;
          margin: 0 auto;
          aspect-ratio: 9 / 19.5;
          border-radius: 32px;
          border: 1px solid var(--border-strong);
          overflow: hidden;
          background: var(--bg-raised);
          box-shadow: var(--shadow-lg);
        }

        .hero-visual__phone-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-visual__phone-ui {
          position: relative;
          height: 100%;
          display: grid;
          align-content: space-between;
          gap: 16px;
          padding: 20px 18px;
        }

        .hero-visual__pill {
          display: inline-flex;
          width: fit-content;
          min-height: 28px;
          align-items: center;
          padding: 0 12px;
          border-radius: var(--radius-pill);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero-visual__sheet {
          display: grid;
          gap: 8px;
          padding: 18px;
          border-radius: 24px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }

        .hero-visual__sheet p,
        .hero-visual__spotlight p,
        .hero-visual__spotlight small {
          margin: 0;
          color: var(--text-secondary);
        }

        .hero-visual__sheet strong,
        .hero-visual__spotlight strong {
          color: var(--text-primary);
        }

        /* MOTIVO: destaque absoluto permanece contido no pai relativo do mockup, sem invadir outras colunas. */
        .hero-visual__spotlight {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          display: grid;
          gap: 8px;
          padding: 16px;
          border-radius: 22px;
          border: 1px solid var(--border-strong);
          background: var(--bg-card);
          box-shadow: var(--shadow-soft);
        }

        .hero-visual__metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
        }

        .hero-visual__metric {
          flex: 1 1 0;
          min-width: 120px;
          display: grid;
          gap: 6px;
          padding: 14px 12px;
          border-radius: 18px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-raised);
        }

        .hero-visual__metric span {
          color: var(--text-secondary);
          font-size: 0.74rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-visual__metric strong {
          color: var(--text-primary);
          font-size: 1rem;
        }
      `}</style>

      <section className="hero-visual" aria-label="Preview do aplicativo">
        <div className="hero-visual__frame">
          <div className="hero-visual__phone-shell">
            <div className="hero-visual__phone">
              <img className="hero-visual__phone-image" src={phoneVisual} alt="" aria-hidden="true" />
              <div className="hero-visual__phone-ui">
                <span className="hero-visual__pill">Agenda premium</span>
                <div className="hero-visual__sheet">
                  <span className="hero-visual__pill">Hoje</span>
                  <strong>{selectedBarber?.name || "Atendimento de assinatura"}</strong>
                  <p>
                    {selectedBarber?.heroTagline ||
                      "Corte, barba e acabamento com leitura profissional em cada detalhe."}
                  </p>
                </div>
              </div>

              <div className="hero-visual__spotlight">
                <span className="hero-visual__pill">Destaque</span>
                <strong>{selectedBarber?.name || "Experiencia premium"}</strong>
                <p>
                  {selectedBarber?.heroTagline ||
                    "Reserva direta, atendimento de presenca e acompanhamento operacional no mesmo fluxo."}
                </p>
                <small>Fluxo mobile em destaque sem sobrepor as metricas.</small>
              </div>
            </div>
          </div>

          <div className="hero-visual__metrics">
            {metrics.map((metric) => (
              <div key={metric.id} className="hero-visual__metric">
                <span>{metric.label}</span>
                <strong>{loading ? "..." : metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
