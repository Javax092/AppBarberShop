import { useImagens } from "../hooks/useImagens";

export function GaleriaPublica() {
  const { imagens, isLoading, error } = useImagens();

  if (isLoading) {
    return <p>Carregando galeria...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!imagens.length) {
    return <p>Nenhuma imagem publicada.</p>;
  }

  return (
    <section>
      <h2>Galeria publica</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px"
        }}
      >
        {imagens.map((imagem) => (
          <figure key={imagem.path}>
            <img
              src={imagem.publicUrl}
              alt={imagem.name}
              loading="lazy"
              style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 12 }}
            />
            <figcaption>{imagem.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
