import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Promocao, Servico } from "../../types/index.ts";

const promocaoSchema = z
  .object({
    title: z.string().min(3, "Informe o título."),
    description: z.string().min(10, "Detalhe a promoção."),
    discountPercent: z.coerce.number().min(1).max(100),
    serviceId: z.string().min(1, "Selecione um serviço."),
    startsAt: z.string().min(1, "Informe o início."),
    endsAt: z.string().min(1, "Informe o fim."),
    isActive: z.boolean()
  })
  .refine((value) => value.endsAt > value.startsAt, {
    path: ["endsAt"],
    message: "O fim precisa ser depois do início."
  });

type PromocaoFormValues = z.infer<typeof promocaoSchema>;

export function FormPromocao({
  promocao,
  servicos,
  onSubmit,
  onCancel,
  loading
}: {
  promocao?: Promocao | null;
  servicos: Servico[];
  onSubmit: (values: PromocaoFormValues, file: File | null) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PromocaoFormValues>({
    resolver: zodResolver(promocaoSchema),
    defaultValues: {
      title: promocao?.title ?? "",
      description: promocao?.description ?? "",
      discountPercent: promocao?.discountPercent ?? 10,
      serviceId: promocao?.serviceId ?? "",
      startsAt: promocao?.startsAt ? promocao.startsAt.slice(0, 16) : "",
      endsAt: promocao?.endsAt ? promocao.endsAt.slice(0, 16) : "",
      isActive: promocao?.isActive ?? true
    }
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(async (values, event) => {
        const fileInput = event?.target instanceof HTMLFormElement ? event.target.elements.namedItem("image") : null;
        const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] ?? null : null;
        await onSubmit(values, file);
      })}
    >
      <div>
        <label className="label">Título</label>
        <input className="field" {...register("title")} />
        {errors.title ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.title.message}</p> : null}
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea className="field min-h-28" {...register("description")} />
        {errors.description ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.description.message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Desconto %</label>
          <input className="field" type="number" {...register("discountPercent")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Serviço vinculado</label>
          <select className="field" {...register("serviceId")}>
            <option value="">Selecione</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Início</label>
          <input className="field" type="datetime-local" {...register("startsAt")} />
        </div>
        <div>
          <label className="label">Fim</label>
          <input className="field" type="datetime-local" {...register("endsAt")} />
        </div>
      </div>
      <div>
        <label className="label">Imagem</label>
        <input className="field" name="image" type="file" />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-[#f0ede6]">
        <input type="checkbox" {...register("isActive")} />
        Promoção ativa
      </label>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="btn-primary" disabled={loading} type="submit">
          {loading ? "Salvando..." : "Salvar promoção"}
        </button>
      </div>
    </form>
  );
}
