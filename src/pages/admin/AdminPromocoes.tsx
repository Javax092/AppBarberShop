import { useState } from "react";
import { toast } from "sonner";

import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { CardPromocao } from "../../components/promocoes/CardPromocao.tsx";
import { FormPromocao } from "../../components/promocoes/FormPromocao.tsx";
import { Modal } from "../../components/ui/Modal.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useCatalogo } from "../../hooks/useCatalogo.ts";
import { usePromocoes } from "../../hooks/usePromocoes.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";
import type { Promocao } from "../../types/index.ts";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/promocoes", label: "Promoções" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/agendamentos", label: "Agendamentos" }
];

export function AdminPromocoes() {
  const { promocoes, loading, salvar, alternarStatus, remover } = usePromocoes(true);
  const { servicos } = useCatalogo(true);
  const [selected, setSelected] = useState<Promocao | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="pb-16">
      <Navbar authenticated links={adminLinks} subtitle="CRUD completo de promoções com vigência e vínculo ao serviço." title="Admin Promoções" />
      <main className="shell mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <BotaoVoltar to="/admin" />
          <button className="btn-primary" onClick={() => { setSelected(null); setOpen(true); }} type="button">
            Nova promoção
          </button>
        </div>
        {loading ? <Spinner /> : null}
        <div className="grid gap-4">
          {promocoes.map((promocao) => (
            <CardPromocao
              key={promocao.id}
              actions={
                <>
                  <button className="btn-secondary px-4 py-2" onClick={() => { setSelected(promocao); setOpen(true); }} type="button">
                    Editar
                  </button>
                  <button className="btn-secondary px-4 py-2" onClick={() => void alternarStatus(promocao.id, !promocao.isActive)} type="button">
                    {promocao.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="btn-secondary px-4 py-2"
                    onClick={async () => {
                      if (!window.confirm("Tem certeza?")) {
                        return;
                      }
                      try {
                        await remover(promocao.id);
                        toast.success("Promoção excluída.");
                      } catch (error) {
                        toast.error(formatSupabaseError(error));
                      }
                    }}
                    type="button"
                  >
                    Excluir
                  </button>
                </>
              }
              promocao={promocao}
            />
          ))}
        </div>
      </main>

      <Modal onClose={() => setOpen(false)} open={open} title={selected ? "Editar promoção" : "Nova promoção"}>
        <FormPromocao
          loading={submitting}
          onCancel={() => setOpen(false)}
          onSubmit={async (values, file) => {
            setSubmitting(true);
            try {
              await salvar(
                {
                  id: selected?.id,
                  ...values,
                  imageUrl: selected?.imageUrl ?? null,
                  startsAt: new Date(values.startsAt).toISOString(),
                  endsAt: new Date(values.endsAt).toISOString()
                },
                file
              );
              toast.success("Promoção salva.");
              setOpen(false);
            } catch (error) {
              toast.error(formatSupabaseError(error));
            } finally {
              setSubmitting(false);
            }
          }}
          promocao={selected}
          servicos={servicos}
        />
      </Modal>
    </div>
  );
}
