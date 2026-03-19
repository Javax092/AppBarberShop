// src/components/admin/BrandManager.jsx - edicao de marca e galeria com preview ao vivo e toggles CSS puros.
/**
 * @param {{
 *   brandConfig: { logoText: string, logoImageUrl?: string, businessWhatsapp: string, heroTitle?: string, heroDescription?: string },
 *   onBrandConfigChange: (field: string, value: string|boolean) => void,
 *   onSaveBrandSettings: (event: React.FormEvent<HTMLFormElement>) => void,
 *   isSavingBrand: boolean,
 *   onUploadBrandLogo: (file: File|null) => void,
 *   galleryPosts: import('../../types').GalleryPost[],
 *   galleryEditorForm: import('../../types').GalleryPost,
 *   onGalleryEditorChange: (field: string, value: string|boolean) => void,
 *   onSaveGalleryPost: (event: React.FormEvent<HTMLFormElement>) => void,
 *   isSavingGalleryPost: boolean,
 *   galleryActionId: string,
 *   onEditGalleryPost: (post: import('../../types').GalleryPost) => void,
 *   onCreateGalleryPost: () => void,
 *   onToggleGalleryPostActive: (post: import('../../types').GalleryPost) => void,
 *   onUploadGalleryImage: (file: File|null) => void,
 *   staffFeedback: string
 * }} props
 */
export function BrandManager({
  brandConfig,
  onBrandConfigChange,
  onSaveBrandSettings,
  isSavingBrand,
  onUploadBrandLogo,
  galleryPosts,
  galleryEditorForm,
  onGalleryEditorChange,
  onSaveGalleryPost,
  isSavingGalleryPost,
  galleryActionId,
  onEditGalleryPost,
  onCreateGalleryPost,
  onToggleGalleryPostActive,
  onUploadGalleryImage,
  staffFeedback
}) {
  const cx = {
    wrap: "glass-card subsection-card",
    posts: "brand-manager__posts",
    post: "brand-manager__post"
  };

  return (
    <>
      <style>{`
        /* ALTERACAO: gestor de marca com preview vivo da logo, grid editorial 1:1 e toggle switch sem dependencia extra. */
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
        .brand-manager__posts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .brand-manager__post {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid var(--border-soft);
          background: rgba(255,255,255,0.03);
        }
        .brand-manager__post img,
        .brand-manager__post-placeholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 16px;
          object-fit: cover;
          background: linear-gradient(135deg, var(--color-smoke), var(--color-blade));
        }
        .brand-manager__toggle {
          position: relative;
          width: 48px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          transition: background 200ms ease;
        }
        .brand-manager__toggle::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--color-cream);
          transition: transform 200ms ease;
        }
        .brand-manager__toggle[data-active="true"] {
          background: rgba(198,145,55,0.4);
        }
        .brand-manager__toggle[data-active="true"]::after {
          transform: translateX(20px);
          background: var(--color-gold-light);
        }
      `}</style>

      <section className={cx.wrap}>
        <div className="section-head compact">
          <div>
            <span className="mini-badge">Marca</span>
            <h2>Logo e galeria</h2>
          </div>
          <p>Cliente pode trocar logo, capa e posts visuais sem mexer no codigo.</p>
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

        <form className="form-grid" onSubmit={onSaveGalleryPost}>
          <div className="section-head compact">
            <div>
              <span className="mini-badge">Posts</span>
              <h2>Galeria do layout</h2>
            </div>
          </div>
          <label>
            Titulo
            <input value={galleryEditorForm.title} onChange={(event) => onGalleryEditorChange("title", event.target.value)} />
          </label>
          <label>
            Tag
            <input value={galleryEditorForm.tag} onChange={(event) => onGalleryEditorChange("tag", event.target.value)} />
          </label>
          <label>
            Ordem
            <input type="number" min="1" value={galleryEditorForm.sortOrder} onChange={(event) => onGalleryEditorChange("sortOrder", event.target.value)} />
          </label>
          <label className="full">
            Legenda
            <textarea value={galleryEditorForm.caption} onChange={(event) => onGalleryEditorChange("caption", event.target.value)} />
          </label>
          <label className="full">
            Imagem do post
            <input aria-label="Enviar imagem da galeria" type="file" accept="image/*" onChange={(event) => onUploadGalleryImage(event.target.files?.[0] ?? null)} />
          </label>
          <div className="actions-row">
            <button className="primary-button" aria-label="Salvar post da galeria" type="submit" disabled={isSavingGalleryPost}>
              {isSavingGalleryPost ? "Salvando..." : galleryEditorForm.id ? "Atualizar post" : "Criar post"}
            </button>
            <button className="secondary-button" aria-label="Criar novo post" type="button" onClick={onCreateGalleryPost}>
              Novo post
            </button>
          </div>
        </form>

        <div className={cx.posts}>
          {galleryPosts.map((post) => (
            <article key={post.id} className={cx.post}>
              {post.imageUrl ? <img src={post.imageUrl} alt={post.title} /> : <div className="brand-manager__post-placeholder" />}
              <span className="tag">{post.tag}</span>
              <strong>{post.title}</strong>
              <div className="actions-row">
                <button className="secondary-button compact-button" aria-label={`Editar post ${post.title}`} type="button" onClick={() => onEditGalleryPost(post)}>
                  Editar
                </button>
                <button className="secondary-button compact-button" aria-label={`Alternar status do post ${post.title}`} type="button" onClick={() => onToggleGalleryPostActive(post)} disabled={galleryActionId === post.id}>
                  <span className="brand-manager__toggle" data-active={post.isActive} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
