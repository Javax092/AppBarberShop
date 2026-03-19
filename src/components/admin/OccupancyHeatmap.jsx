// src/components/admin/OccupancyHeatmap.jsx - visualizacao da ocupacao semanal e conflitos operacionais em uma unica secao.
import { formatLongDate } from "../../utils/schedule";

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94A2 2 0 0 0 22.18 18L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

const heatMapColors = {
  low: "#2A2825",
  medium: "#7A4F1A",
  high: "#C9A84C",
  full: "#A0291C"
};

/**
 * @param {{
 *   occupancyHeatmap: import('../../types').OccupancyRow[],
 *   scheduleConflicts: Array<{ id: string, date: string, appointments: import('../../types').Appointment[] }>
 * }} props
 */
export function OccupancyHeatmap({ occupancyHeatmap, scheduleConflicts }) {
  const cx = {
    wrap: "glass-card subsection-card",
    row: "occupancy-row",
    cell: "occupancy-cell",
    conflict: "occupancy-conflict"
  };

  return (
    <>
      <style>{`
        /* ALTERACAO: heatmap modular com niveis de calor fixos e conflitos destacados em vermelho operacional. */
        .occupancy-grid {
          display: grid;
          gap: 14px;
        }
        .occupancy-row {
          display: grid;
          gap: 10px;
        }
        .occupancy-cells {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
          gap: 8px;
        }
        .occupancy-cell {
          min-height: 72px;
          display: grid;
          align-content: center;
          gap: 4px;
          padding: 10px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .occupancy-conflicts {
          display: grid;
          gap: 12px;
        }
        .occupancy-conflict {
          display: grid;
          grid-template-columns: 16px 1fr;
          gap: 12px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid rgba(160,41,28,0.4);
          background: rgba(160,41,28,0.12);
        }
        .occupancy-conflict svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: #ffb7af;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          margin-top: 2px;
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Heatmap</span>
            <h2>Ocupacao da semana</h2>
          </div>
          <p>Leitura rapida de janelas fortes e fracas por profissional.</p>
        </div>

        <div className="occupancy-grid">
          {occupancyHeatmap.map((row) => (
            <div key={row.barberId} className={cx.row}>
              <strong>{row.barberName}</strong>
              <div className="occupancy-cells">
                {row.cells.map((cell) => (
                  <div
                    key={`${row.barberId}-${cell.date}`}
                    className={cx.cell}
                    title={`${cell.label} • ${cell.tooltip}`}
                    style={{ background: heatMapColors[cell.heat] || heatMapColors.low }}
                  >
                    <span>{cell.label.split(",")[0]}</span>
                    <strong>{Math.round(cell.occupancyRate)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="section-head compact">
          <div>
            <span className="mini-badge">Conflitos</span>
            <h2>Operacao sem atrito</h2>
          </div>
          <p>Duplo encaixe e sobreposicao aparecem antes de virarem problema.</p>
        </div>

        {scheduleConflicts.length ? (
          <div className="occupancy-conflicts">
            {scheduleConflicts.map((conflict) => (
              <article key={conflict.id} className={cx.conflict}>
                <AlertIcon />
                <div>
                  <strong>{formatLongDate(conflict.date)}</strong>
                  <p>
                    {conflict.appointments[0].clientName} x {conflict.appointments[1].clientName}
                  </p>
                  <small>
                    {conflict.appointments[0].startTime} ate {conflict.appointments[1].endTime}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="notice-box">Nenhum conflito ativo na agenda.</div>
        )}
      </section>
    </>
  );
}
