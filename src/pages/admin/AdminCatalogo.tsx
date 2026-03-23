import { useState } from "react";
import { toast } from "sonner";

import { FormServico } from "../../components/catalogo/FormServico.tsx";
import { ListaCatalogo } from "../../components/catalogo/ListaCatalogo.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { Modal } from "../../components/ui/Modal.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useCatalogo } from "../../hooks/useCatalogo.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";
import type { Servico } from "../../types/index.ts";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/promocoes", label: "Promoções" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/agendamentos", label: "Agendamentos" }
];

export function AdminCatalogo() {
  const { servicos, loading, salvar, alternarStatus, remover } = useCatalogo(true);
  const [selected, setSelected] = useState<Servico | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="pb-16">
      <Navbar authenticated links={adminLinks} subtitle="CRUD completo de serviços com status, foto e preço." title="Admin Catálogo" />
      <main className="shell mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <BotaoVoltar to="/admin" />
          <button className="btn-primary" onClick={() => { setSelected(null); setOpen(true); }} type="button">
            Novo serviço
          </button>
        </div>
        {loading ? <Spinner /> : null}
        <ListaCatalogo
          renderAdminActions={(servico) => (
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary px-4 py-2" onClick={() => { setSelected(servico); setOpen(true); }} type="button">
                Editar
              </button>
              <button className="btn-secondary px-4 py-2" onClick={() => void alternarStatus(servico.id, !servico.isActive)} type="button">
                {servico.isActive ? "Desativar" : "Ativar"}
              </button>
              <button
                className="btn-secondary px-4 py-2"
                onClick={async () => {
                  if (!window.confirm("Tem certeza?")) {
                    return;
                  }
                  try {
                    await remover(servico.id);
                    toast.success("Serviço removido.");
                  } catch (error) {
                    toast.error(formatSupabaseError(error));
                  }
                }}
                type="button"
              >
                Excluir
              </button>
            </div>
          )}
          servicos={servicos}
        />
      </main>

      <Modal onClose={() => setOpen(false)} open={open} title={selected ? "Editar serviço" : "Novo serviço"}>
        <FormServico
          loading={submitting}
          onCancel={() => setOpen(false)}
          onSubmit={async (values, file) => {
            setSubmitting(true);
            try {
              await salvar(
                {
                  id: selected?.id,
                  ...values,
                  imageUrl: selected?.imageUrl ?? null
                },
                file
              );
              toast.success("Serviço salvo.");
              setOpen(false);
            } catch (error) {
              toast.error(formatSupabaseError(error));
            } finally {
              setSubmitting(false);
            }
          }}
          servico={selected}
        />
      </Modal>
    </div>
  );
}
