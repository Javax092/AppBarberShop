import { GaleriaPublica } from "../components/GaleriaPublica";

export function PublicPage() {
  return (
    <main>
      <h1>Galeria publica</h1>
      <p>Leitura aberta para usuarios anonimos, sem sessao e sem fluxo de upload.</p>
      <GaleriaPublica />
    </main>
  );
}
