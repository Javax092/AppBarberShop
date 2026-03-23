import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Servico } from "../../types/index.ts";

const servicoSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  description: z.string().min(10, "Detalhe melhor o serviço."),
  price: z.coerce.number().positive("Informe um preço válido."),
  durationMinutes: z.coerce.number().int().positive("Informe a duração."),
  category: z.string().min(2, "Informe a categoria."),
  isActive: z.boolean(),
  featured: z.boolean()
});

type ServicoFormValues = z.infer<typeof servicoSchema>;

export function FormServico({
  servico,
  onSubmit,
  onCancel,
  loading
}: {
  servico?: Servico | null;
  onSubmit: (values: ServicoFormValues, file: File | null) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      name: servico?.name ?? "",
      description: servico?.description ?? "",
      price: servico?.price ?? 0,
      durationMinutes: servico?.durationMinutes ?? 30,
      category: servico?.category ?? "",
      isActive: servico?.isActive ?? true,
      featured: servico?.featured ?? false
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
        <label className="label" htmlFor="service-name">
          Nome
        </label>
        <input className="field" id="service-name" {...register("name")} />
        {errors.name ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.name.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="service-description">
          Descrição
        </label>
        <textarea className="field min-h-28" id="service-description" {...register("description")} />
        {errors.description ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.description.message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="service-price">
            Preço
          </label>
          <input className="field" id="service-price" step="0.01" type="number" {...register("price")} />
        </div>
        <div>
          <label className="label" htmlFor="service-duration">
            Duração
          </label>
          <input className="field" id="service-duration" type="number" {...register("durationMinutes")} />
        </div>
        <div>
          <label className="label" htmlFor="service-category">
            Categoria
          </label>
          <input className="field" id="service-category" {...register("category")} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="service-image">
          Foto
        </label>
        <input className="field" id="service-image" name="image" type="file" />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-[#f0ede6]">
        <input type="checkbox" {...register("featured")} />
        Destacar na home
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-[#f0ede6]">
        <input type="checkbox" {...register("isActive")} />
        Serviço ativo
      </label>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="btn-primary" disabled={loading} type="submit">
          {loading ? "Salvando..." : "Salvar serviço"}
        </button>
      </div>
    </form>
  );
}
