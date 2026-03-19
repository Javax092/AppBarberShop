// src/components/admin/CrmPanel.jsx - painel CRM com reativacao horizontal e cards de clientes em tres zonas bem definidas.
import { formatCurrency } from "../../utils/schedule";
import { getFavoriteServices, getLoyaltyProfile } from "../../utils/experience";

const tierColor = { diamond: "#C9A84C", gold: "#E8C97A", silver: "#9E9480", bronze: "#5A5040" };

function mapTier(loyalty) {
  if (loyalty.tier === "ouro") return { label: "Diamond", color: tierColor.diamond };
  if (loyalty.tier === "prata") return { label: "Silver", color: tierColor.silver };
  return { label: "Bronze", color: tierColor.bronze };
}

/**
 * @param {{
 *   customers: import('../../types').Customer[],
 *   reactivationCandidates: Array<{ id: string, fullName: string, segment: string, favoriteServices: string, whatsappLink: string, businessWhatsappLink: string }>,
 *   customerDrafts: Record<string, string>,
 *   onCustomerDraftChange: (customerId: string, value: string) => void,
 *   onSaveCustomerNotes: (customer: import('../../types').Customer) => void,
 *   customerActionId: string
 * }} props
 */
export function CrmPanel({
  customers,
  reactivationCandidates,
  customerDrafts,
  onCustomerDraftChange,
  onSaveCustomerNotes,
  customerActionId
}) {
  const cx = {
    wrap: "glass-card subsection-card",
    strip: "crm-panel__strip",
    grid: "crm-panel__grid",
    card: "crm-panel__card"
  };

  return (
    <>
      <style>{`
        /* ALTERACAO: CRM com faixa de reativacao em snap horizontal e cards divididos em topo, meio e base. */
        .crm-panel__strip {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(260px, 320px);
          gap: 14px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
        }
        .crm-panel__strip > * { scroll-snap-align: start; }
        .crm-panel__candidate,
        .crm-panel__card {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .crm-panel__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .crm-panel__metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .crm-panel__metric {
          padding: 10px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head">
          <div>
            <span className="mini-badge">CRM</span>
            <h2>Cadastro completo de clientes</h2>
          </div>
          <p>Historico, frequencia, ticket medio, ultimo atendimento e observacoes internas.</p>
        </div>

        {reactivationCandidates.length ? (
          <div className={cx.strip} data-touch-list="true">
            {reactivationCandidates.map((candidate) => (
              <article key={candidate.id} className="crm-panel__candidate">
                <span className="tag">{candidate.segment}</span>
                <strong>{candidate.fullName}</strong>
                <p>{candidate.favoriteServices}</p>
                <div className="actions-row">
                  <a className="secondary-button compact-button" aria-label={`Reativar cliente ${candidate.fullName}`} href={candidate.whatsappLink} target="_blank" rel="noreferrer">Reativar cliente</a>
                  <a className="secondary-button compact-button" aria-label={`Abrir comercial para ${candidate.fullName}`} href={candidate.businessWhatsappLink} target="_blank" rel="noreferrer">Abrir no comercial</a>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className={cx.grid}>
          {customers.map((customer) => {
            const loyalty = getLoyaltyProfile(customer);
            const tier = mapTier(loyalty);
            return (
              <article key={customer.id} className={cx.card}>
                <div>
                  <strong>{customer.fullName}</strong>
                  <div className="actions-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span>{customer.whatsapp}</span>
                    <span className="tag" style={{ background: tier.color, color: "#120D09", borderColor: "transparent" }}>{tier.label}</span>
                  </div>
                </div>
                <div className="crm-panel__metrics">
                  <div className="crm-panel__metric"><small>Ticket</small><strong>{formatCurrency(customer.averageTicket || 0)}</strong></div>
                  <div className="crm-panel__metric"><small>Lifetime</small><strong>{formatCurrency(customer.lifetimeValue || 0)}</strong></div>
                  <div className="crm-panel__metric"><small>Cadencia</small><strong>{Math.round(customer.cadenceDays || 0)} dias</strong></div>
                  <div className="crm-panel__metric"><small>Ultimo</small><strong>{customer.lastAppointmentAt ? new Date(customer.lastAppointmentAt).toLocaleDateString("pt-BR") : "-"}</strong></div>
                </div>
                <p>Favoritos: {getFavoriteServices(customer)}</p>
                <div>
                  <textarea value={customerDrafts[customer.id] ?? customer.notes ?? ""} onChange={(event) => onCustomerDraftChange(customer.id, event.target.value)} placeholder="Observacoes internas" />
                  <button className="secondary-button compact-button" aria-label={`Salvar observacoes de ${customer.fullName}`} type="button" onClick={() => onSaveCustomerNotes(customer)} disabled={customerActionId === customer.id}>
                    {customerActionId === customer.id ? "Salvando..." : "Salvar observacao"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
