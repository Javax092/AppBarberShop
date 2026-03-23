import { Link, useNavigate } from "react-router-dom";

import { CardBarbeiro } from "../../components/barbeiro/CardBarbeiro.tsx";
import { ListaCatalogo } from "../../components/catalogo/ListaCatalogo.tsx";
import { BannerPromocao } from "../../components/promocoes/BannerPromocao.tsx";
import { BarberCardSkeleton, MetricSkeleton, ServiceCardSkeleton, Skeleton } from "../../components/ui/Skeleton.jsx";
import { usePublicHome } from "../../hooks/usePublicHome.ts";

const landingLinks = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/barbeiros", label: "Barbeiros" },
  { to: "/agendamento", label: "Agendar" }
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

export function HomePage() {
  const navigate = useNavigate();

  const { barbers: barbeiros, services: servicos, metrics, loading } = usePublicHome();
  const promocaoAtiva = servicos.map((item) => item.promotion).filter((item) => item?.status === "ativa");
  const promocaoDestaque = promocaoAtiva[0] ?? null;
  const servicosAtivos = servicos.filter((item) => item.isActive !== false);
  const barbeirosAtivos = barbeiros.filter((item) => item.isActive !== false);

  const topServico = servicosAtivos
    .slice()
    .sort((left, right) => {
      const leftScore = Number(Boolean(left.featured)) + Number(Boolean(left.promotion));
      const rightScore = Number(Boolean(right.featured)) + Number(Boolean(right.promotion));
      return rightScore - leftScore;
    })[0];

  const destaqueServico = servicosAtivos[0];

  const metricCards = [
    {
      label: "Serviços ativos",
      value: `${metrics.servicesCount || servicosAtivos.length}`,
      helper: `${metrics.categoriesCount} categorias disponíveis`
    },
    {
      label: "Especialistas",
      value: `${metrics.barbersCount || barbeirosAtivos.length}`,
      helper: "Equipe pronta para atender"
    },
    {
      label: "Promoções",
      value: `${promocaoAtiva.length}`,
      helper: promocaoDestaque
        ? `${promocaoDestaque.discountPercent}% em destaque`
        : "Nenhuma campanha ativa"
    },
    {
      label: "Perfis com foto",
      value: `${metrics.barbersWithPhotos}`,
      helper: metrics.barbersWithPhotos > 0 ? "identidade visual ativa" : "avatares padronizados em uso"
    }
  ];

  const heroIndicators = [
    "Reserva online em poucos passos",
    `${barbeirosAtivos.length} especialistas apresentados`,
    `${metrics.barbersWithPhotos} perfis com identidade visual completa`
  ];

  const heroServicePrice = destaqueServico ? formatCurrency(destaqueServico.price) : "Consulte";
  const topServicePrice = topServico ? formatCurrency(topServico.price) : "Consulte";

  return (
    <div className="pb-24">
      <header className="shell pt-4 sm:pt-6">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#110e0b] px-4 py-5 shadow-2xl shadow-black/30 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
          <div className="relative">
            <div className="mb-6 flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#c9a96e]/25 bg-[#c9a96e]/10 p-2">
                  <img
                    alt="Opaitaon"
                    className="max-h-full max-w-full object-contain"
                    src="/paion2.png"
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#c9a96e]">
                    Opaitaon Barbearia
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/40">
                    Luxury Booking System
                  </p>
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-4">
                {landingLinks.map((link) => (
                  <Link
                    key={link.to}
                    className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55 transition hover:text-white"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="grid items-stretch gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="flex flex-col justify-center">
                <span className="mb-3 inline-flex w-fit rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e7c992]">
                  Agendamento premium
                </span>

                <h1 className="max-w-2xl font-display text-[2.2rem] leading-[0.96] text-[#f0ede6] sm:text-[3rem] lg:text-[4rem]">
                  Agende com clareza, ritmo e presença de marca.
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-[15px]">
                  Escolha o serviço, selecione o especialista e confirme o horário com
                  uma experiência fluida, compacta e premium.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#c9a96e] px-6 text-sm font-semibold text-[#16120d] shadow-lg shadow-black/30 transition hover:scale-[1.01] hover:bg-[#d7b67c]"
                    to="/agendamento"
                  >
                    Agendar agora
                  </Link>

                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-6 text-sm font-semibold text-[#f0ede6] transition hover:bg-white/[0.06]"
                    to="/catalogo"
                  >
                    Ver serviços
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {heroIndicators.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/70"
                    >
                      {item}
                    </span>
                  ))}
                </div>

              </div>

              <aside className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      Curadoria em destaque
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#f0ede6]">
                      Escolha o serviço ideal e confirme sua reserva com mais clareza.
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Fluxo guiado
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Próximo destaque
                    </p>
                    <strong className="mt-2 block text-base text-[#f0ede6]">
                      {topServico?.name ?? "Curadoria premium"}
                    </strong>
                    <small className="mt-1 block text-sm text-[#c9a96e]">
                      {topServicePrice}
                    </small>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Reserva simplificada
                    </p>
                    <strong className="mt-2 block text-base text-[#f0ede6]">
                      Profissional, serviço e horário na mesma jornada
                    </strong>
                    <small className="mt-1 block text-sm text-white/55">
                      Sem expor dados operacionais do salão na área pública
                    </small>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                        Especialistas em destaque
                      </span>
                      <span className="text-[11px] text-white/45">
                        {barbeirosAtivos.length} perfis
                      </span>
                    </div>

                    <div className="space-y-2">
                      {barbeirosAtivos.slice(0, 3).length > 0 ? (
                        barbeirosAtivos.slice(0, 3).map((barber) => (
                          <div
                            key={barber.id}
                            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                          >
                            <strong className="text-sm text-[#f0ede6]">{barber.name}</strong>
                            <span className="text-xs text-white/60">
                              {(barber.specialties[0] || "Atendimento premium").slice(0, 28)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-sm text-white/50">
                          Equipe em atualização
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                        Vantagens da experiência
                      </span>
                      <span className="text-[11px] text-white/45">
                        3 pilares
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        "Escolha direta do barbeiro",
                        "Catálogo com preço e duração",
                        "Confirmação imediata ao final"
                      ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                          >
                            <span className="min-w-[48px] text-sm font-semibold text-[#c9a96e]">•</span>
                            <div className="min-w-0">
                              <strong className="block truncate text-sm text-[#f0ede6]">{item}</strong>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Valor de referência
                    </p>
                    <strong className="mt-2 block text-lg text-[#f0ede6]">
                      {formatCurrency(topServico?.price ?? destaqueServico?.price ?? 0)}
                    </strong>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                      Serviço sugerido
                    </p>
                    <strong className="mt-2 block text-base text-[#f0ede6]">
                      {destaqueServico?.name ?? "Consulta premium"}
                    </strong>
                    <small className="mt-1 block text-sm text-[#c9a96e]">
                      {heroServicePrice}
                    </small>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </header>

      <main className="shell mt-6 space-y-6 sm:mt-8 sm:space-y-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <MetricSkeleton key={index} />)
            : metricCards.map((item, index) => (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-lg shadow-black/10 backdrop-blur"
                  style={{ animationDelay: `${index * 60 + 80}ms` }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    {item.label}
                  </span>
                  <strong className="mt-3 block text-3xl font-semibold text-[#f0ede6]">
                    {item.value}
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-white/60">{item.helper}</p>
                </article>
              ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">
                Promoções em destaque
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-[#f0ede6] sm:text-3xl">
                Oferta premium da plataforma
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/60">
              Uma campanha única, com composição mais limpa e foco total no valor percebido.
            </p>
          </div>

          {loading ? <Skeleton className="h-[280px] w-full rounded-[32px]" /> : null}
          {!loading && promocaoDestaque ? <BannerPromocao promocao={promocaoDestaque} /> : null}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">
                Serviços mais procurados
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-[#f0ede6] sm:text-3xl">
                Catálogo com escolha rápida
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="max-w-xl text-sm leading-7 text-white/60">
                Itens mais consistentes, leitura mais escaneável e CTA mais direto para converter
                interesse em reserva.
              </p>
              <Link
                className="text-sm font-semibold text-[#c9a96e] transition hover:text-[#e7c992]"
                to="/catalogo"
              >
                Abrir catálogo
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <ListaCatalogo
              onAgendar={(servico) => navigate(`/agendamento?serviceId=${servico.id}`)}
              servicos={servicos.slice(0, 3)}
            />
          )}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c9a96e]">
                Especialistas da casa
              </span>
              <h2 className="mt-3 text-2xl font-semibold text-[#f0ede6] sm:text-3xl">
                Escolha com confiança
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="max-w-xl text-sm leading-7 text-white/60">
                Perfis com mais assinatura, autoridade e clareza para o cliente decidir quem vai
                atendê-lo.
              </p>
              <Link
                className="text-sm font-semibold text-[#c9a96e] transition hover:text-[#e7c992]"
                to="/barbeiros"
              >
                Ver equipe
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <BarberCardSkeleton key={index} />)
              : barbeiros.slice(0, 3).map((barbeiro) => (
                  <CardBarbeiro
                    key={barbeiro.id}
                    barbeiro={barbeiro}
                    onAgendar={() => navigate(`/agendamento?barberId=${barbeiro.id}`)}
                  />
                ))}
          </div>
        </section>
      </main>

      <Link
        className="fixed bottom-5 left-4 right-4 z-20 inline-flex h-14 items-center justify-between rounded-2xl bg-[#c9a96e] px-5 text-sm font-semibold text-[#16120d] shadow-2xl shadow-black/30 sm:hidden"
        to="/agendamento"
      >
        <span>Agendar agora</span>
        <span>{servicosAtivos.length} serviços</span>
      </Link>
    </div>
  );
}
