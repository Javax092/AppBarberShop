import { format } from "date-fns";

import type { ReactNode } from "react";

import type { Promocao } from "../../types/index.ts";

const statusClasses: Record<Promocao["status"], string> = {
  ativa: "status-badge status-badge-confirmed",
  futura: "status-badge status-badge-pending",
  expirada: "status-badge status-badge-cancelled"
};

export function CardPromocao({
  promocao,
  actions
}: {
  promocao: Promocao;
  actions?: ReactNode;
}) {
  return (
    <article className="surface-elevated p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={statusClasses[promocao.status]}>
            {promocao.status}
          </span>
          <h3 className="mt-4 font-display text-4xl text-[#f0ede6]">{promocao.title}</h3>
          <p className="mt-2 text-sm leading-7 text-[rgba(240,237,230,0.62)]">{promocao.description}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-5xl text-[#c9a96e]">{promocao.discountPercent}%</p>
          <p className="text-xs text-[rgba(240,237,230,0.48)]">até {format(new Date(promocao.endsAt), "dd/MM/yyyy")}</p>
        </div>
      </div>
      {actions ? <div className="mt-5 flex justify-end gap-3">{actions}</div> : null}
    </article>
  );
}
