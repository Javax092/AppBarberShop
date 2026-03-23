import { useMemo, useState } from "react";
import { EmptyState } from "./ui/EmptyState";

const editorialImages = {
  booking: "",
  beard: "/barba.jpeg",
  ambience: "/ambiente.jpeg"
};

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function GalleryStrip({ galleryPosts = [] }) {
  const [activePanel, setActivePanel] = useState("posts");

  const editorialPosts = useMemo(
    () => [
      {
        id: "editorial-booking",
        title: galleryPosts[0]?.title || "Agenda premium",
        caption:
          galleryPosts[0]?.caption ||
          "Reserva direta, leitura clara e presenca visual forte para transformar o primeiro contato em decisao de agendamento.",
        tag: galleryPosts[0]?.tag || "Reserva",
        imageUrl: galleryPosts[0]?.imageUrl || editorialImages.booking
      },
      {
        id: "editorial-beard",
        title: galleryPosts[1]?.title || "Barba de presenca",
        caption:
          galleryPosts[1]?.caption ||
          "Desenho limpo, volume equilibrado e acabamento preciso para valorizar a barba como servico de alto nivel.",
        tag: galleryPosts[1]?.tag || "Barba premium",
        imageUrl: galleryPosts[1]?.imageUrl || editorialImages.beard
      },
      {
        id: "editorial-ambience",
        title: galleryPosts[2]?.title || "Ambiente que vende",
        caption:
          galleryPosts[2]?.caption ||
          "O espaco da barbearia reforca confianca, eleva a percepcao da marca e sustenta a operacao com imagem real.",
        tag: galleryPosts[2]?.tag || "Experiencia",
        imageUrl: galleryPosts[2]?.imageUrl || editorialImages.ambience
      }
    ],
    [galleryPosts]
  );

  const hasGalleryPosts = galleryPosts.length > 0;

  return (
    <>
      <style>{`
        /* ALTERACAO: galeria com tabs refinadas, cards 3/4, overlay no hover e placeholder editorial. */
        .gallery-strip {
          display: grid;
          gap: 18px;
        }

        .gallery-switch {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .gallery-switch button {
          min-height: 48px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--color-gold-border);
          background: transparent;
          color: var(--color-muted);
          transition: background 200ms var(--ease-smooth), color 200ms var(--ease-smooth), border-color 200ms var(--ease-smooth);
        }

        .gallery-switch button.active {
          background: var(--color-gold);
          color: var(--color-dark);
          font-weight: 700;
          border-color: var(--color-gold);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .gallery-card {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid var(--border-soft);
          background: var(--surface-elevated);
          aspect-ratio: 3 / 4;
        }

        .gallery-card__media {
          position: absolute;
          inset: 0;
        }

        .gallery-card__media img,
        .gallery-card__placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          object-fit: cover;
        }

        .gallery-card__placeholder {
          background: linear-gradient(135deg, var(--color-smoke), var(--color-blade));
          color: var(--color-muted);
        }

        .gallery-card__placeholder svg {
          width: 34px;
          height: 34px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .gallery-card__overlay {
          position: absolute;
          inset: 0;
          display: grid;
          align-content: end;
          padding: 18px;
          background:
            linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.82) 92%);
        }

        .gallery-card__hover {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.3);
          color: var(--color-cream);
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 2.4vw, 2rem);
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .gallery-card:hover .gallery-card__hover {
          opacity: 1;
        }

        .gallery-card:hover .gallery-card__media {
          transform: scale(1.02);
          transition: transform 300ms ease;
        }

        .gallery-copy {
          display: grid;
          gap: 10px;
        }

        .gallery-copy p,
        .gallery-copy strong {
          margin: 0;
        }

        .gallery-badge {
          width: fit-content;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .lookbook-card {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          overflow: hidden;
          border-radius: 32px;
          border: 1px solid var(--border-soft);
          background:
            linear-gradient(135deg, rgba(198, 145, 55, 0.14), transparent 46%),
            var(--surface-elevated);
        }

        .lookbook-visual img {
          width: 100%;
          height: 100%;
          min-height: 420px;
          object-fit: cover;
          display: block;
        }

        .lookbook-copy {
          display: grid;
          align-content: center;
          gap: 16px;
          padding: 34px;
        }

        .lookbook-specs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lookbook-specs span {
          min-height: 32px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @media (max-width: 900px) {
          .gallery-grid,
          .lookbook-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="gallery-strip">
        <div className="section-head">
          <div>
            <span className="mini-badge">Visual</span>
            <h2>Imagem de marca</h2>
          </div>
          <p>Campanhas visuais, ambiente real e uma vitrine propria para barba completa.</p>
        </div>

        <div className="gallery-switch" role="tablist" aria-label="Visual da marca">
          <button
            className={activePanel === "posts" ? "active" : ""}
            onClick={() => setActivePanel("posts")}
            type="button"
          >
            Publicacoes
          </button>
          <button
            className={activePanel === "look" ? "active" : ""}
            onClick={() => setActivePanel("look")}
            type="button"
          >
            Novo visual
          </button>
        </div>

        {activePanel === "posts" ? (
          hasGalleryPosts ? (
            <div className="gallery-grid">
              {editorialPosts.map((post) => (
                <article key={post.id} className="gallery-card">
                  <div className="gallery-card__media">
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.title} />
                    ) : (
                      <div className="gallery-card__placeholder" aria-hidden="true">
                        <CameraIcon />
                      </div>
                    )}
                  </div>
                  <div className="gallery-card__hover">{post.title}</div>
                  <div className="gallery-card__overlay">
                    <div className="gallery-copy">
                      <span className="gallery-badge">{post.tag}</span>
                      <strong>{post.title}</strong>
                      <p>{post.caption}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="gallery-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="gallery-card">
                  <div className="gallery-card__placeholder" aria-hidden="true">
                    <CameraIcon />
                  </div>
                </article>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <EmptyState
                  title="Nenhuma foto na galeria."
                  description="Adicione a primeira imagem editorial para dar contexto visual a reserva."
                  actionLabel="Adicionar primeira foto"
                />
              </div>
            </div>
          )
        ) : (
          <article className="lookbook-card">
            <div className="lookbook-visual">
              <img src={editorialImages.beard} alt="Barba completa em destaque" />
            </div>
            <div className="lookbook-copy">
              <span className="mini-badge">Novo visual</span>
              <h3>Barba completa</h3>
              <p>
                Uma vitrine dedicada para comunicar presenca, acabamento e cuidado nos detalhes com linguagem de marca
                mais madura.
              </p>
              <div className="lookbook-specs">
                <span>Contorno preciso</span>
                <span>Volume alinhado</span>
                <span>Acabamento premium</span>
              </div>
            </div>
          </article>
        )}
      </section>
    </>
  );
}
