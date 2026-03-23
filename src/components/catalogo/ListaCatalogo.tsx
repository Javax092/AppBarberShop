import type { ReactNode } from "react";

import type { Servico } from "../../types/index.ts";
import { EmptyState } from "../ui/EmptyState.tsx";
import { CardServico } from "./CardServico.tsx";

export function ListaCatalogo({
  servicos,
  onAgendar,
  renderAdminActions
}: {
  servicos: Servico[];
  onAgendar?: (servico: Servico) => void;
  renderAdminActions?: (servico: Servico) => ReactNode;
}) {
  if (servicos.length === 0) {
    return <EmptyState description="Adicione servicos para alimentar o catalogo." title="Catalogo vazio" />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {servicos.map((servico) => (
        <CardServico
          key={servico.id}
          adminActions={renderAdminActions ? renderAdminActions(servico) : undefined}
          onAgendar={onAgendar}
          servico={servico}
        />
      ))}
    </div>
  );
}
