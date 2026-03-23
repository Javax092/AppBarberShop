import { useNavigate } from "react-router-dom";

import { CardBarbeiro } from "../../components/barbeiro/CardBarbeiro.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { BarberCardSkeleton } from "../../components/ui/Skeleton.jsx";
import { usePublicHome } from "../../hooks/usePublicHome.ts";

export function BarbeirosPage() {
  const navigate = useNavigate();
  const { barbers: barbeiros, loading } = usePublicHome();

  return (
    <div className="pb-16">
      <Navbar subtitle="Conheça a equipe Opaitaon, suas especialidades e acesse a agenda com mais confiança." title="Especialistas Opaitaon" />
      <main className="shell mt-8 space-y-6">
        <BotaoVoltar to="/" />
        <section className="section-frame">
          <span className="section-kicker">Equipe</span>
          <h2 className="mt-4 font-display text-4xl text-[#f0ede6] sm:text-5xl">Profissionais apresentados como uma extensão da marca.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">
            A página reforça autoridade, especialidades e qualidade de atendimento antes mesmo da reserva ser concluída.
          </p>
        </section>
        {barbeiros.length === 0 && !loading ? (
          <EmptyState description="Cadastre barbeiros no painel admin para exibi-los aqui." title="Nenhum barbeiro disponível" />
        ) : null}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <BarberCardSkeleton key={index} />)
            : barbeiros.map((barbeiro) => (
                <CardBarbeiro key={barbeiro.id} barbeiro={barbeiro} onAgendar={() => navigate(`/agendamento?barberId=${barbeiro.id}`)} />
              ))}
        </div>
      </main>
    </div>
  );
}
