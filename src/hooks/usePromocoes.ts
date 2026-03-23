import { useCallback, useEffect, useState } from "react";

import { deletePromocao, listPromocoes, togglePromocao, upsertPromocao } from "../lib/promocoes.ts";
import type { Promocao, PromocaoPayload } from "../types/index.ts";

export function usePromocoes(includeInactive = false) {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPromocoes(includeInactive);
      setPromocoes(data);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    promocoes,
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
