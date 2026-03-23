import type { Barbeiro } from "../../types/index.ts";
import { BarberAvatar } from "../barbeiro/BarberAvatar.tsx";

export function SeletorBarbeiro({
  barbeiros,
  selectedBarberId,
  onSelect
}: {
  barbeiros: Barbeiro[];
  selectedBarberId: string | null;
  onSelect: (barberId: string | null) => void;
}) {
  return (
    <section className="surface-elevated p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="section-kicker">Etapa 1</span>
          <h2 className="mt-3 max-w-3xl font-display text-4xl text-[#f0ede6] sm:text-5xl">
            Escolha quem vai conduzir sua experiência com o nível de precisão que você espera.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
          O fluxo permite reservar com um especialista específico ou priorizar velocidade, deixando o sistema escolher o melhor encaixe.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <button
          className={`choice-card p-6 text-left ${selectedBarberId === null ? "choice-card-active" : ""}`}
          onClick={() => onSelect(null)}
          type="button"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="choice-pill">Mais rápido</span>
                <h3 className="mt-4 font-display text-4xl leading-none text-[#f0ede6]">Primeiro especialista disponível</h3>
              </div>
              <span className="choice-check">{selectedBarberId === null ? "✓" : "01"}</span>
            </div>

            <p className="mt-5 text-sm leading-7 text-[rgba(240,237,230,0.62)]">
              Ideal para quem quer confirmar logo. O sistema distribui sua reserva para o profissional com melhor disponibilidade.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="choice-pill">Confirmação mais ágil</span>
              <span className="choice-pill">Melhor encaixe do dia</span>
            </div>
          </div>
        </button>

        {barbeiros.map((barbeiro, index) => (
          <button
            key={barbeiro.id}
            className={`choice-card p-6 text-left ${selectedBarberId === barbeiro.id ? "choice-card-active" : ""}`}
            onClick={() => onSelect(barbeiro.id)}
            type="button"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <BarberAvatar
                    className={`h-20 w-20 ${
                      selectedBarberId === barbeiro.id ? "border-[#c9a96e]" : "border-[rgba(201,169,110,0.18)]"
                    }`}
                    imageUrl={barbeiro.avatarUrl}
                    initialsClassName="text-2xl"
                    name={barbeiro.name}
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c9a96e]">Especialista</p>
                    <h3 className="mt-2 font-display text-4xl leading-none text-[#f0ede6]">{barbeiro.name}</h3>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[rgba(240,237,230,0.5)]">
                      Perfil {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                </div>
                <span className="choice-check">{selectedBarberId === barbeiro.id ? "✓" : String(index + 2).padStart(2, "0")}</span>
              </div>

              <p className="mt-5 text-sm leading-7 text-[rgba(240,237,230,0.62)]">{barbeiro.bio}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {(barbeiro.specialties.length > 0 ? barbeiro.specialties : ["Cortes clássicos", "Acabamento premium"]).slice(0, 3).map((item) => (
                  <span key={item} className="choice-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
