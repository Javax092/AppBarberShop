// src/components/admin/LogsPanel.jsx - lista monitorada de logs com destaque por nivel e foco automatico nos eventos mais recentes.
import { useEffect, useMemo, useRef } from "react";

const levelColor = { error: "#ff8d84", warn: "#f0c472", info: "var(--color-muted)", debug: "var(--color-smoke)" };

/**
 * @param {{
 *   logs: Array<{ id: string, level: string, eventType: string, message: string, source?: string, createdAt: string }>
 * }} props
 */
export function LogsPanel({ logs }) {
  const lastLogRef = useRef(null);
  const recentErrors = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return logs.filter((log) => log.level === "error" && new Date(log.createdAt).getTime() >= cutoff).length;
  }, [logs]);

  useEffect(() => {
    lastLogRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <>
      <style>{`
        /* ALTERACAO: painel de logs com contagem de erros recentes e destaque cromatico por severidade. */
        .logs-panel__list {
          display: grid;
          gap: 12px;
          max-height: 720px;
          overflow: auto;
        }
        .logs-panel__item {
          display: grid;
          gap: 8px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
      `}</style>

      <section className="glass-card subsection-card">
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Monitoramento</span>
            <h2>Logs recentes</h2>
          </div>
          <p>{recentErrors} erros nas ultimas 24h.</p>
        </div>
        <div className="logs-panel__list">
          {logs.map((log, index) => (
            <article key={log.id} ref={index === logs.length - 1 ? lastLogRef : null} className="logs-panel__item">
              <span className="tag" style={{ color: levelColor[log.level] || "var(--color-smoke)" }}>{log.level}</span>
              <strong>{log.eventType}</strong>
              <p>{log.message}</p>
              <small>{new Date(log.createdAt).toLocaleString("pt-BR")} • {log.source}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
