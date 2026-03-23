import type { ReactNode } from "react";

import type { Servico } from "../../types/index.ts";

export function CardServico({
  servico,
  onAgendar,
  adminActions
}: {
  servico: Servico;
  onAgendar?: (servico: Servico) => void;
  adminActions?: ReactNode;
}) {
  const finalPrice = servico.promotion
    ? servico.price - servico.price * (servico.promotion.discountPercent / 100)
    : servico.price;

  return (
    <article className="service-premium-card group overflow-hidden">
      <div className="service-premium-card__media">
        {servico.imageUrl ? (
          <img alt={servico.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" src={servico.imageUrl} />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl text-[rgba(240,237,230,0.34)]">{servico.name[0]}</div>
        )}
        {servico.promotion ? (
          <div className="service-premium-card__ribbon">
            Oferta ativa
          </div>
        ) : null}
        <div className="service-premium-card__overlay">
          <div>
            <span className="choice-pill">{servico.category}</span>
          </div>
          <span className="service-premium-card__duration">{servico.durationMinutes} min</span>
        </div>
      </div>

      <div className="service-premium-card__body">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="service-premium-card__eyebrow">Experiência da casa</p>
            <h3>{servico.name}</h3>
            <p>{servico.description}</p>
          </div>
        </div>

        <div className="service-premium-card__meta">
          {servico.isActive === false ? (
            <span className="status-badge status-badge-cancelled">Inativo</span>
          ) : (
            <span className="status-badge status-badge-confirmed">Disponível</span>
          )}
          <span className="service-premium-card__meta-copy">
            {servico.featured ? "Seleção premium" : "Reserva imediata"}
          </span>
        </div>

        <div className="service-premium-card__footer">
          <div className="service-premium-card__price">
            <span className="service-premium-card__currency">R$</span>
            <strong>
              {finalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            {servico.promotion ? (
              <span className="service-premium-card__original">
                {servico.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            ) : null}
          </div>

          {onAgendar ? (
            <button
              className="btn-secondary service-premium-card__action"
              onClick={() => onAgendar(servico)}
              type="button"
            >
              Agendar serviço
            </button>
          ) : adminActions}
        </div>
      </div>
    </article>
  );
}
