import { useEffect, useState } from "react";
import { listarImagensPublicas, type ImagemPublica } from "../lib/imagens";

interface UseImagensResult {
  imagens: ImagemPublica[];
  isLoading: boolean;
  error: string;
  reload: () => Promise<void>;
}

export function useImagens(): UseImagensResult {
  const [imagens, setImagens] = useState<ImagemPublica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(): Promise<void> {
    setIsLoading(true);
    setError("");

    try {
      const items = await listarImagensPublicas();
      setImagens(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar a galeria publica.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return {
    imagens,
    isLoading,
    error,
    reload: load
  };
}
