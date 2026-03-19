// src/components/admin/AdminHeader.jsx - resumo executivo do dashboard administrativo com metricas, banner ao vivo e faixas financeiras.
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../utils/schedule";

function easeOutExpo(value) {
  return value === 1 ? 1 : 1 - 2 ** (-10 * value);
}

function AnimatedValue({ value, formatter = (input) => input }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    const target = Number(value ?? 0);

    const tick = (timestamp) => {
      const progress = Math.min((timestamp - start) / 800, 1);
      setCurrent(Math.round(target * easeOutExpo(progress)));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <strong>{formatter(current)}</strong>;
}

function MetricIcon({ type }) {
  const paths = {
    revenue: "M12 3v18M17 7.5c0-1.93-2.24-3.5-5-3.5S7 5.57 7 7.5 9.24 11 12 11s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5",
    ticket: "M5 12h14M12 5v14M6 6l12 12",
    occupancy: "M5 19h14M7 16V8m5 8V5m5 11v-6",
    customers: "M16 19a4 4 0 0 0-8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type]} />
    </svg>
  );
}

/**
 * @param {{
 *   adminStats: import('../../types').AdminStats,
 *   occupancyStats: { rate: number, bookedMinutes: number, availableMinutes: number },
 *   realtimeStatusLabel: string,
 *   weeklyDemandNarrative: string
 * }} props
 */
export function AdminHeader({
  adminStats,
  occupancyStats,
  realtimeStatusLabel,
  weeklyDemandNarrative
}) {
  const cx = {
    section: "glass-card subsection-card",
    metrics: "admin-header__metrics",
    metric: "admin-header__metric clickable-card",
    strip: "admin-header__strip",
    card: "admin-header__finance-card"
  };

  const metricItems = useMemo(
    () => [
      { id: "gross", label: "faturamento total", value: adminStats.grossRevenue, icon: "revenue", formatter: formatCurrency },
      { id: "ticket", label: "ticket medio", value: adminStats.averageTicket, icon: "ticket", formatter: formatCurrency },
      { id: "occupancy", label: "ocupacao hoje", value: occupancyStats.rate, icon: "occupancy", formatter: (value) => `${value}%` },
      { id: "customers", label: "clientes no crm", value: adminStats.total - adminStats.cancelled + adminStats.confirmed, icon: "customers" }
    ],
    [adminStats, occupancyStats.rate]
  );

  const financeItems = [
    { label: "Receita do dia", value: formatCurrency(adminStats.todayRevenue) },
    { label: "Reservas confirmadas", value: adminStats.confirmed },
    { label: "Atendimentos concluidos", value: adminStats.completed },
    { label: "Lider em receita", value: adminStats.topBarber?.barber?.name || "-" }
  ];

  const projectionItems = [
    { label: "Minutos ocupados", value: `${Math.round(occupancyStats.bookedMinutes || 0)} min` },
    { label: "Capacidade util", value: `${Math.round(occupancyStats.availableMinutes || 0)} min` },
    { label: "Taxa da grade", value: `${Math.round(occupancyStats.rate || 0)}%` },
    { label: "Narrativa semanal", value: weeklyDemandNarrative.slice(0, 52) + (weeklyDemandNarrative.length > 52 ? "..." : "") }
  ];

  return (
    <>
      <style>{`
        /* ALTERACAO: header administrativo modular com metricas animadas, banner de operacao e strips financeiros. */
        .admin-header__metrics,
        .admin-header__strip {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .admin-header__metric,
        .admin-header__finance-card {
          display: grid;
          gap: 10px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .admin-header__metric:hover {
          border-color: var(--color-gold);
        }
        .admin-header__metric strong,
        .admin-header__finance-card strong {
          font-size: clamp(1.4rem, 3vw, 2.2rem);
          color: var(--color-gold-light);
        }
        .admin-header__metric-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: var(--label-size-fluid);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .admin-header__metric-label svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .admin-header__banner {
          display: grid;
          gap: 10px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-strong);
          background: rgba(198,145,55,0.08);
        }
        .admin-header__live {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .admin-header__dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--status-success);
          animation: adminPulse 1.4s ease-in-out infinite;
        }
        @keyframes adminPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(86,193,141,0.38); }
          50% { box-shadow: 0 0 0 8px rgba(86,193,141,0.06); }
        }
      `}</style>

      <section className={cx.section}>
        <div className="section-head">
          <div>
            <span className="mini-badge">Gestao</span>
            <h2>Controle da barbearia</h2>
          </div>
          <p>Agenda, equipe, marca e operacao em um painel direto.</p>
        </div>

        <div className={cx.metrics}>
          {metricItems.map((item) => (
            <article key={item.id} className={cx.metric}>
              <span className="admin-header__metric-label">
                <MetricIcon type={item.icon} />
                {item.label}
              </span>
              <AnimatedValue value={item.value} formatter={item.formatter} />
            </article>
          ))}
        </div>

        <div className="admin-header__banner">
          <div className="admin-header__live">
            <span className="admin-header__dot" aria-hidden="true" />
            <span className="mini-badge">Ao vivo</span>
            <strong>{realtimeStatusLabel}</strong>
          </div>
          <p>{weeklyDemandNarrative}</p>
        </div>

        <div className={cx.strip}>
          {financeItems.map((item) => (
            <article key={item.label} className={cx.card}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className={cx.strip}>
          {projectionItems.map((item) => (
            <article key={item.label} className={cx.card}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
