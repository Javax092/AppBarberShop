import { useCallback, useEffect, useMemo, useState } from "react";

import { deleteServico, listServicos, toggleServico, upsertServico } from "../lib/catalogo.ts";
import { listPromocoes } from "../lib/promocoes.ts";
import type { Servico, ServicoPayload } from "../types/index.ts";

export function useCatalogo(includeInactive = false) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const promocoes = await listPromocoes(true);
      const data = await listServicos(promocoes, includeInactive);
      setServicos(data);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categorias = useMemo(
    () => Array.from(new Set(servicos.map((item) => item.category))).sort((left, right) => left.localeCompare(right)),
    [servicos]
  );

  return {
    servicos,
    categorias,
    loading,
    refresh,
    salvar: async (payload: ServicoPayload, file?: File | null) => {
      await upsertServico(payload, file);
      await refresh();
    },
    alternarStatus: async (id: string, isActive: boolean) => {
      await toggleServico(id, isActive);
      await refresh();
    },
    remover: async (id: string) => {
      await deleteServico(id);
      await refresh();
    }
  };
}
