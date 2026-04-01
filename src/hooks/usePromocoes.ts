import { useCallback, useEffect, useState } from "react";

import { deletePromocao, listPromocoes, togglePromocao, upsertPromocao } from "../lib/promocoes.ts";
import type { Promocao, PromocaoPayload } from "../types/index.ts";

export function usePromocoes(includeInactive = false) {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPromocoes(includeInactive);
      setPromocoes(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar as promocoes.");
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    promocoes,
    error,
    loading,
    refresh,
    salvar: async (payload: PromocaoPayload, file?: File | null) => {
      await upsertPromocao(payload, file);
      await refresh();
    },
    alternarStatus: async (id: string, isActive: boolean) => {
      await togglePromocao(id, isActive);
      await refresh();
    },
    remover: async (id: string) => {
      await deletePromocao(id);
      await refresh();
    }
  };
}
