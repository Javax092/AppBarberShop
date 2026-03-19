export function ClientCard({
  client,
  onOpenWhatsapp
}) {
  // ALTERACAO: historico resumido para CRM compacto em mobile.
  const recentAppointments = client.appointments?.slice(0, 3) ?? [];

  return (
    <>
      <style>{`
        /* ALTERACAO: card de CRM com historico inline e CTA rapido de WhatsApp. */
        .client-card-v2 {
          display: grid;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-soft);
          background: var(--surface-elevated);
          box-shadow: var(--shadow-soft);
        }

        .client-card-v2__topline,
        .client-card-v2__stats {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .client-card-v2__muted {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .client-card-v2__history {
          display: grid;
          gap: var(--space-2);
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .client-card-v2__history-item {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,.04);
          font-size: var(--text-sm);
        }

        .client-card-v2__cta {
          min-height: 48px;
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-pill);
          background: linear-gradient(180deg, rgba(240,196,114,.18), rgba(198,145,55,.12));
          color: var(--text-primary);
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .client-card-v2__cta:focus-visible {
          outline: 2px solid var(--color-gold-light);
          outline-offset: 2px;
        }
      `}</style>

      <article className="client-card-v2">
        <div className="client-card-v2__topline">
          <div>
            <strong>{client.fullName}</strong>
            <p className="client-card-v2__muted" style={{ margin: "6px 0 0" }}>
              {client.whatsapp}
            </p>
          </div>
          <button
            className="client-card-v2__cta"
            type="button"
            aria-label={`Falar com ${client.fullName} no WhatsApp`}
            onClick={() => onOpenWhatsapp?.(client)}
          >
            Chamar no WhatsApp
          </button>
        </div>

        <div className="client-card-v2__stats">
          {/* ALTERACAO: snapshot rapido de recorrencia e ultimo servico. */}
          <span className="client-card-v2__muted">Visitas: {client.visitCount ?? 0}</span>
          <span className="client-card-v2__muted">Ultimo corte: {client.lastServiceNames?.[0] ?? "Sem historico"}</span>
        </div>

        <ul className="client-card-v2__history" role="list" aria-label={`Ultimos agendamentos de ${client.fullName}`}>
          {/* ALTERACAO: timeline curta dos 3 atendimentos mais recentes. */}
          {recentAppointments.map((appointment) => (
            <li key={appointment.id} className="client-card-v2__history-item">
              <span>{appointment.date}</span>
              <span>{appointment.serviceName ?? appointment.serviceNames?.join(", ") ?? "Atendimento"}</span>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}
