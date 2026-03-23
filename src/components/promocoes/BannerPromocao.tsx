import { format } from "date-fns";
import { Link } from "react-router-dom";

import type { Promocao } from "../../types/index.ts";

export function BannerPromocao({ promocao }: { promocao: Promocao }) {
  return (
    <article className="promo-spotlight">
      <div className="promo-spotlight__content">
        <div className="promo-spotlight__copy">
          <span className="section-kicker">Curadoria Opaitaon</span>
          <h3>{promocao.title}</h3>
          <p>{promocao.description}</p>

          <div className="promo-spotlight__chips">
            <span className="home-chip">Reserva com desconto aplicado</span>
            <span className="home-chip">Válida até {format(new Date(promocao.endsAt), "dd/MM")}</span>
          </div>

          <div className="promo-spotlight__actions">
            <Link className="btn-primary" to={`/agendamento?serviceId=${promocao.serviceId}`}>
              Agendar promoção
            </Link>
            <Link className="btn-secondary" to="/catalogo">
              Ver catálogo
            </Link>
          </div>
        </div>

        <div className="promo-spotlight__meta">
          <div className="promo-spotlight__discount">
            <span>Benefício ativo</span>
            <strong>{promocao.discountPercent}%</strong>
            <small>desconto imediato</small>
          </div>

          <div className="promo-spotlight__detail">
            <span className="home-panel-label">Janela da campanha</span>
            <strong>{format(new Date(promocao.startsAt), "dd/MM")} - {format(new Date(promocao.endsAt), "dd/MM/yyyy")}</strong>
          </div>

          <div className="promo-spotlight__detail">
            <span className="home-panel-label">Aplicação</span>
            <strong>Serviço selecionado com reserva online</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
