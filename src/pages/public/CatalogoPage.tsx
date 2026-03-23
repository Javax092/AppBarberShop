import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ListaCatalogo } from "../../components/catalogo/ListaCatalogo.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useCatalogo } from "../../hooks/useCatalogo.ts";

export function CatalogoPage() {
  const navigate = useNavigate();
  const { servicos, categorias, loading } = useCatalogo();
  const [categoria, setCategoria] = useState("all");

  const filtrados = useMemo(
    () => servicos.filter((item) => categoria === "all" || item.category === categoria),
    [categoria, servicos]
  );

  return (
    <div className="pb-16">
      <Navbar subtitle="Serviços apresentados com hierarquia editorial, leitura rápida de valor e acesso direto ao agendamento." title="Catálogo Opaitaon" />
      <main className="shell mt-8 space-y-6">
        <BotaoVoltar to="/" />
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="section-frame">
            <span className="section-kicker">Curadoria</span>
            <h2 className="mt-4 font-display text-4xl text-[#f0ede6] sm:text-5xl">Escolha um serviço com clareza total de valor.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
              O catálogo foi redesenhado para vender melhor: imagem mais forte, leitura rápida e CTA direto para reservar.
            </p>
          </div>
          <div className="surface-elevated p-5">
            <label className="label">Filtrar por categoria</label>
            <select className="field max-w-sm" value={categoria} onChange={(event) => setCategoria(event.target.value)}>
              <option value="all">Todas</option>
              {categorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>
        {loading ? <Spinner /> : null}
        <ListaCatalogo onAgendar={(servico) => navigate(`/agendamento?serviceId=${servico.id}`)} servicos={filtrados} />
      </main>
    </div>
  );
}
