import type { Servico } from "../../types/index.ts";

function getFinalPrice(servico: Servico) {
  if (!servico.promotion) {
    return servico.price;
  }

  return servico.price - servico.price * (servico.promotion.discountPercent / 100);
}

export function SeletorServico({
  servicos,
  selectedServiceId,
  onSelect
}: {
  servicos: Servico[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
}) {
  return (
    <section className="surface-elevated p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="section-kicker">Etapa 2</span>
          <h2 className="mt-3 max-w-3xl font-display text-4xl text-[#f0ede6] sm:text-5xl">
            Defina o serviço com comparação clara de resultado, duração e investimento.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
          A escolha fica mais direta quando cada card mostra contexto completo, sem obrigar o cliente a abrir telas extras.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {servicos.map((servico) => {
          const finalPrice = getFinalPrice(servico);
          const active = selectedServiceId === servico.id;

          return (
            <button
              key={servico.id}
              className={`choice-card p-6 text-left ${active ? "choice-card-active" : ""}`}
              onClick={() => onSelect(servico.id)}
              type="button"
            >
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="choice-pill">{servico.category}</span>
                    <h3 className="mt-4 font-display text-4xl leading-none text-[#f0ede6]">{servico.name}</h3>
                  </div>
                  <span className="choice-check">{active ? "✓" : "OK"}</span>
                </div>

                <p className="mt-5 text-sm leading-7 text-[rgba(240,237,230,0.62)]">{servico.description}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Duração</p>
                    <p className="mt-2 text-lg font-semibold text-[#f0ede6]">{servico.durationMinutes} min</p>
                  </div>
                  <div className="rounded-[22px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Status</p>
                    <p className="mt-2 text-lg font-semibold text-[#f0ede6]">{servico.isActive === false ? "Inativo" : "Disponível"}</p>
                  </div>
                  <div className="rounded-[22px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">Oferta</p>
                    <p className="mt-2 text-lg font-semibold text-[#f0ede6]">
                      {servico.promotion ? `${servico.promotion.discountPercent}% off` : "Padrão"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-[rgba(201,169,110,0.1)] pt-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(240,237,230,0.45)]">Investimento</p>
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <span className="font-display text-4xl leading-none text-[#f0ede6]">
                        {finalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      {servico.promotion ? (
                        <span className="text-sm text-[rgba(240,237,230,0.34)] line-through">
                          {servico.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span className={`rounded-full px-5 py-3 text-sm font-semibold ${active ? "bg-[#c9a96e] text-[#16120d]" : "border border-[rgba(201,169,110,0.24)] text-[#f0ede6]"}`}>
                    {active ? "Selecionado" : "Escolher"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
