import { useEffect, useMemo } from "react";
import { useImagens } from "../../hooks/useImagens";
import { useToast } from "../../hooks/useToast";
import { AdminUpload } from "../AdminUpload";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/**
 * @param {{
 *   brandConfig: { logoText: string, logoImageUrl?: string, businessWhatsapp: string, heroTitle?: string, heroDescription?: string },
 *   onBrandConfigChange: (field: string, value: string|boolean) => void,
 *   onSaveBrandSettings: (event: React.FormEvent<HTMLFormElement>) => void,
 *   isSavingBrand: boolean,
 *   onUploadBrandLogo: (file: File|null) => void,
 *   staffFeedback: string
 * }} props
 */
export function BrandManager({
  brandConfig,
  onBrandConfigChange,
  onSaveBrandSettings,
  isSavingBrand,
  onUploadBrandLogo,
  staffFeedback,
  session
}) {
  const { showToast } = useToast();
  const { imagens, isLoading: loading, error, reload } = useImagens();
  const canUpload = session?.role === "admin" && session?.authMode !== "app_users";

  useEffect(() => {
    if (!error) {
      return;
    }

    showToast({
      type: "error",
      title: "Galeria indisponivel",
      message: error
    });
  }, [error, showToast]);

  const orderedPosts = useMemo(() => imagens.slice(), [imagens]);

  return (
    <>
      <style>{`
        /* ALTERACAO: gestor de marca com formulario de galeria persistente e lista admin em grid 3 colunas. */
        .brand-manager {
          display: grid;
          gap: 20px;
        }

        .brand-manager__hero {
          display: grid;
          grid-template-columns: 96px 1fr;
          gap: 16px;
          align-items: center;
        }

        .brand-manager__logo {
          width: 96px;
          height: 96px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          object-fit: cover;
          background: rgba(255,255,255,0.04);
        }

        .brand-manager__preview {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.05);
        }

        .brand-manager__preview img,
        .brand-manager__preview-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-manager__preview-placeholder {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(47, 43, 36, 0.92), rgba(111, 87, 42, 0.88));
          color: rgba(255, 248, 230, 0.72);
        }

        .brand-manager__preview-placeholder svg {
          width: 28px;
          height: 28px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .brand-manager__gallery-form {
          display: grid;
          gap: 16px;
        }

        .brand-manager__switch {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          cursor: pointer;
        }

        .brand-manager__switch input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .brand-manager__track {
          position: relative;
          width: 52px;
          height: 30px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          transition: background 200ms ease;
        }

        .brand-manager__track::after {
          content: "";
          position: absolute;
          top: 4px;
          left: 4px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--color-cream);
          transition: transform 200ms ease;
        }

        .brand-manager__switch input:checked + .brand-manager__track {
          background: rgba(198,145,55,0.42);
        }

        .brand-manager__switch input:checked + .brand-manager__track::after {
          transform: translateX(22px);
          background: var(--color-gold-light);
        }

        .brand-manager__posts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .brand-manager__post {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .brand-manager__post[data-inactive="true"] {
          opacity: 0.5;
        }

        .brand-manager__post img,
        .brand-manager__post-placeholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          object-fit: cover;
          background: linear-gradient(135deg, rgba(33, 31, 26, 0.96), rgba(111, 87, 42, 0.88));
        }

        .brand-manager__post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .brand-manager__tag {
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(198, 145, 55, 0.18);
          border: 1px solid rgba(198, 145, 55, 0.32);
          color: var(--text-accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .brand-manager__post strong {
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.25;
        }

        .brand-manager__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .brand-manager__actions button,
        .brand-manager__gallery-form button,
        .brand-manager__hero input[type="file"],
        .brand-manager__gallery-form input[type="file"] {
          min-height: 48px;
        }

        .brand-manager__empty {
          padding: 18px;
          border-radius: 16px;
          border: 1px dashed var(--border-soft);
          color: var(--text-secondary);
        }

        @media (max-width: 900px) {
          .brand-manager__posts {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .brand-manager__hero,
          .brand-manager__post-header {
            grid-template-columns: 1fr;
          }

          .brand-manager__hero {
            grid-template-columns: 1fr;
          }

          .brand-manager__posts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="glass-card subsection-card brand-manager">
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Marca</span>
            <h2>Logo e galeria</h2>
          </div>
          <p>Branding persistente com logo privada para escrita e imagens publicas para leitura.</p>
        </div>

        <form className="form-grid" onSubmit={onSaveBrandSettings}>
          <div className="brand-manager__hero">
            <img className="brand-manager__logo" src={brandConfig.logoImageUrl || "/paitaon.png"} alt={brandConfig.logoText} />
            <label>
              Upload da logo
              <input aria-label="Enviar nova logo" type="file" accept="image/*" onChange={(event) => onUploadBrandLogo(event.target.files?.[0] ?? null)} />
            </label>
          </div>
          <label>
            Texto da logo
            <input value={brandConfig.logoText} onChange={(event) => onBrandConfigChange("logoText", event.target.value)} />
          </label>
          <label>
            WhatsApp comercial
            <input value={brandConfig.businessWhatsapp} onChange={(event) => onBrandConfigChange("businessWhatsapp", event.target.value)} />
          </label>
          <label className="full">
            Hero title
            <input value={brandConfig.heroTitle || ""} onChange={(event) => onBrandConfigChange("heroTitle", event.target.value)} />
          </label>
          <label className="full">
            Hero descricao
            <textarea value={brandConfig.heroDescription || ""} onChange={(event) => onBrandConfigChange("heroDescription", event.target.value)} />
          </label>
          <div className="actions-row">
            <button className="primary-button" aria-label="Salvar configuracoes de marca" type="submit" disabled={isSavingBrand}>
              {isSavingBrand ? "Salvando..." : "Salvar marca"}
            </button>
          </div>
          {staffFeedback ? <p className="feedback-line">{staffFeedback}</p> : null}
        </form>

        <div className="form-grid brand-manager__gallery-form">
          <div className="section-head compact">
            <div>
              <span className="mini-badge">Storage</span>
              <h2>Galeria publica</h2>
            </div>
          </div>

          <AdminUpload
            isAdmin={canUpload}
            onUploaded={async () => {
              await reload();
              showToast({
                type: "success",
                title: "Imagem publicada",
                message: "A imagem ficou visivel publicamente para usuarios anonimos."
              });
            }}
          />

          {!canUpload ? <p className="feedback-line">Upload disponivel apenas para admin autenticado.</p> : null}
        </div>

        {loading ? <p className="brand-manager__empty">Carregando imagens da galeria...</p> : null}

        {!loading && orderedPosts.length ? (
          <div className="brand-manager__posts">
            {orderedPosts.map((post) => (
              <article key={post.path} className="brand-manager__post" data-inactive="false">
                {post.publicUrl ? (
                  <img src={post.publicUrl} alt={post.name} />
                ) : (
                  <div className="brand-manager__post-placeholder" aria-hidden="true" />
                )}

                <div className="brand-manager__post-header">
                  <span className="brand-manager__tag">publico</span>
                </div>

                <strong>{post.name}</strong>

                <div className="brand-manager__actions">
                  <a className="secondary-button compact-button" href={post.publicUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !orderedPosts.length ? (
          <div className="brand-manager__empty">Nenhuma imagem da galeria foi publicada ainda.</div>
        ) : null}
      </section>
    </>
  );
}
