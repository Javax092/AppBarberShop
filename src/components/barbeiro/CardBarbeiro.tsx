import type { Barbeiro } from "../../types/index.ts";
import { BarberAvatar } from "./BarberAvatar.tsx";

export function CardBarbeiro({
  barbeiro,
  onAgendar
}: {
  barbeiro: Barbeiro;
  onAgendar?: (barbeiro: Barbeiro) => void;
}) {
  const primarySpecialty = barbeiro.specialties[0] || "Cortes personalizados";
  const supportingSpecialties = barbeiro.specialties.slice(1, 3);

  return (
    <article className="barber-premium-card">
      <div className="barber-premium-card__top">
        <BarberAvatar
          className="barber-premium-card__avatar"
          imageUrl={barbeiro.avatarUrl}
          initialsClassName="text-2xl"
          name={barbeiro.name}
          roundedClassName="rounded-[28px]"
          showFallbackLabel
        />
        <div className="barber-premium-card__identity">
          <p className="barber-premium-card__eyebrow">Especialista da casa</p>
          <h3>{barbeiro.name}</h3>
          <p className="barber-premium-card__specialty">{primarySpecialty}</p>
        </div>
      </div>

      <p className="barber-premium-card__bio">{barbeiro.bio}</p>

      <div className="barber-premium-card__tags">
        {supportingSpecialties.length > 0 ? (
          supportingSpecialties.map((item) => (
            <span key={item} className="home-chip">
              {item}
            </span>
          ))
        ) : (
          <span className="home-chip">Acabamento premium</span>
        )}
      </div>

      <div className="barber-premium-card__trust">
        <div>
          <span className="home-panel-label">Assinatura</span>
          <strong>Atendimento de alto padrão</strong>
        </div>
        <div>
          <span className="home-panel-label">Confiança</span>
          <strong>Reserva guiada com especialista</strong>
        </div>
      </div>

      {onAgendar ? (
        <button className="btn-primary barber-premium-card__action" onClick={() => onAgendar(barbeiro)} type="button">
          Agendar com {barbeiro.name.split(" ")[0]}
        </button>
      ) : null}
    </article>
  );
}
