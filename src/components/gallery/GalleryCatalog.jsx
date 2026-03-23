import { useImagens } from "../../hooks/useImagens";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function GallerySkeleton() {
  return (
    <div className="gallery-catalog__grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="gallery-catalog__skeleton" />
      ))}
    </div>
  );
}

export function GalleryCatalog({ onBookingClick }) {
  const { imagens, isLoading, error } = useImagens();

  return (
    <>
      <style>{`
        .gallery-catalog {
          display: grid;
          gap: 18px;
        }

        .gallery-catalog__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .gallery-catalog__card,
        .gallery-catalog__skeleton {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          aspect-ratio: 3 / 4;
          background:
            radial-gradient(circle at top, rgba(207, 168, 92, 0.18), transparent 40%),
            linear-gradient(180deg, rgba(32, 25, 18, 0.9), rgba(14, 11, 8, 0.98));
          border: 1px solid var(--border-soft);
        }

        .gallery-catalog__card {
          transform: translateZ(0);
          transition: transform 0.3s ease;
        }

        .gallery-catalog__card:hover {
          transform: scale(1.02);
        }

        .gallery-catalog__media,
        .gallery-catalog__placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .gallery-catalog__media {
          object-fit: cover;
        }

        .gallery-catalog__placeholder {
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, rgba(33, 31, 26, 0.96), rgba(88, 67, 30, 0.92)),
            linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.4));
          color: rgba(255, 248, 230, 0.82);
        }

        .gallery-catalog__placeholder svg {
          width: 34px;
          height: 34px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .gallery-catalog__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(14, 11, 8, 0.92) 100%);
          transition: background 0.25s ease;
        }

        .gallery-catalog__card:hover .gallery-catalog__overlay {
          background: linear-gradient(to bottom, transparent 40%, rgba(14, 11, 8, 0.96) 100%);
        }

        .gallery-catalog__tag {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          border: 1px solid var(--border-strong);
          color: var(--text-accent);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .gallery-catalog__title {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 68px;
          z-index: 2;
          margin: 0;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 600;
          line-height: 1.12;
        }

        .gallery-catalog__cta {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          z-index: 2;
          min-height: 48px;
          padding: 8px 12px;
          border: 0;
          border-radius: 8px;
          background: var(--text-accent);
          color: var(--text-on-gold);
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
        }

        .gallery-catalog__skeleton {
          isolation: isolate;
        }

        .gallery-catalog__skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
          animation: gallery-catalog-shimmer 1.4s ease-in-out infinite;
        }

        .gallery-catalog__empty {
          display: grid;
          gap: 14px;
          justify-items: start;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border-soft);
          background: rgba(255, 255, 255, 0.03);
        }

        .gallery-catalog__empty button {
          min-height: 48px;
          padding: 12px 18px;
          border: 0;
          border-radius: 10px;
          background: var(--text-accent);
          color: var(--text-on-gold);
          font-weight: 700;
          cursor: pointer;
        }

        @keyframes gallery-catalog-shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (max-width: 767px) {
          .gallery-catalog__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .gallery-catalog__title {
            font-size: 16px;
            bottom: 66px;
          }
        }
      `}</style>

      <section className="gallery-catalog">
        <div className="section-head">
          <div>
            <span className="mini-badge">Visual</span>
            <h2>Catalogo da casa</h2>
          </div>
          <p>Imagens publicas lidas direto do Storage, sem sessao para visitantes.</p>
        </div>

        {isLoading ? <GallerySkeleton /> : null}

        {!isLoading && imagens.length ? (
          <div className="gallery-catalog__grid">
            {imagens.map((imagem) => (
              <article key={imagem.path} className="gallery-catalog__card">
                {imagem.publicUrl ? (
                  <img className="gallery-catalog__media" src={imagem.publicUrl} alt={imagem.name} loading="lazy" />
                ) : (
                  <div className="gallery-catalog__placeholder" aria-hidden="true">
                    <CameraIcon />
                  </div>
                )}
                <div className="gallery-catalog__overlay" aria-hidden="true" />
                <span className="gallery-catalog__tag">publico</span>
                <h3 className="gallery-catalog__title">{imagem.name}</h3>
                <button className="gallery-catalog__cta" type="button" onClick={onBookingClick}>
                  Agendar →
                </button>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && !imagens.length && !error ? (
          <div className="gallery-catalog__empty">
            <p>Nenhuma imagem publica foi encontrada.</p>
            <button type="button" onClick={onBookingClick}>
              Agendar agora →
            </button>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="gallery-catalog__empty">
            <p>{error}</p>
            <button type="button" onClick={onBookingClick}>
              Agendar agora →
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
