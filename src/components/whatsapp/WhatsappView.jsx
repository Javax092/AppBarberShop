// src/components/whatsapp/WhatsappView.jsx - central de relacionamento com cards de contato e timeline de roadmap separada.
const brandLogo = "/paitaon.png";
const STATUS_LABELS = { confirmed: "Confirmado", "in-progress": "Em andamento", done: "Concluido", cancelled: "Cancelado", completed: "Concluido" };

function WhatsappCard({ appointment, hydrated }) {
  return (
    <article className="whatsapp-card">
      <div>
        <span className="tag">{appointment.id}</span>
        <img className="whatsapp-brand-image" src={brandLogo} alt="Logo da barbearia" />
        <h3>{appointment.clientName}</h3>
        <p>{hydrated.barber?.name || "Sem profissional"}</p>
        <span className={`status-pill ${appointment.status}`}>{STATUS_LABELS[appointment.status] ?? appointment.status}</span>
      </div>
      <div className="actions-stack">
        <a className="primary-button" aria-label={`Falar com cliente ${appointment.clientName}`} href={hydrated.clientWhatsappLink} target="_blank" rel="noreferrer">Falar com cliente</a>
        <a className="secondary-button" aria-label={`Falar com barbeiro do agendamento ${appointment.id}`} href={hydrated.barberWhatsappLink} target="_blank" rel="noreferrer">Falar com barbeiro</a>
      </div>
    </article>
  );
}

function RoadmapTimeline() {
  const items = [
    { id: "now", title: "Confirmacoes operacionais", status: "done" },
    { id: "next", title: "Lembretes automáticos", status: "current" },
    { id: "later", title: "Rebook assistido", status: "future" }
  ];
  return (
    <div className="whatsapp-roadmap">
      {items.map((item, index) => (
        <article key={item.id} className="whatsapp-roadmap__item">
          <span className={`whatsapp-roadmap__icon whatsapp-roadmap__icon--${item.status}`}>{index + 1}</span>
          <div><strong>{item.title}</strong><small>{item.status === "done" ? "Pronto" : item.status === "current" ? "Em desenho" : "Backlog"}</small></div>
        </article>
      ))}
    </div>
  );
}

/**
 * @param {{
 *   visibleWhatsappAppointments: import('../../types').Appointment[],
 *   hydrateAppointmentView: (appointment: import('../../types').Appointment) => any
 * }} props
 */
export function WhatsappView({ visibleWhatsappAppointments, hydrateAppointmentView }) {
  return (
    <>
      <style>{`
        /* ALTERACAO: view de WhatsApp com timeline vertical conectada e cards de acao dedicados. */
        .whatsapp-roadmap {
          display: grid;
          gap: 12px;
          margin-bottom: 18px;
        }
        .whatsapp-roadmap__item {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 12px;
          align-items: start;
          position: relative;
        }
        .whatsapp-roadmap__item::before {
          content: "";
          position: absolute;
          left: 13px;
          top: 28px;
          bottom: -12px;
          width: 2px;
          background: rgba(255,255,255,0.08);
        }
        .whatsapp-roadmap__item:last-child::before { display: none; }
        .whatsapp-roadmap__icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.75rem;
        }
        .whatsapp-roadmap__icon--done { background: rgba(86,193,141,0.16); color: var(--status-success); }
        .whatsapp-roadmap__icon--current { background: rgba(198,145,55,0.16); color: var(--color-gold-light); }
        .whatsapp-roadmap__icon--future { background: rgba(255,255,255,0.08); color: var(--text-secondary); }
      `}</style>

      <section className="layout-grid single-column">
        <section className="glass-card">
          <div className="section-head">
            <div>
              <span className="mini-badge">Relacionamento</span>
              <h2>Central de WhatsApp</h2>
            </div>
            <p>Contato rapido com cliente e equipe.</p>
          </div>
          <RoadmapTimeline />
          <div className="whatsapp-grid">
            {visibleWhatsappAppointments.slice().reverse().map((appointment) => <WhatsappCard key={appointment.id} appointment={appointment} hydrated={hydrateAppointmentView(appointment)} />)}
          </div>
        </section>
      </section>
    </>
  );
}
