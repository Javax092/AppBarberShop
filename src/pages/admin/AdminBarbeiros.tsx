import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { BarberAvatar } from "../../components/barbeiro/BarberAvatar.tsx";
import { BarberAvatarField } from "../../components/barbeiro/BarberAvatarField.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { Modal } from "../../components/ui/Modal.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useBarbeiros } from "../../hooks/useBarbeiros.ts";
import { createObjectPreview, validateBarberAvatarFile } from "../../lib/avatar.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";
import type { BarbeiroAdmin } from "../../types/index.ts";

const adminLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/promocoes", label: "Promoções" },
  { to: "/admin/barbeiros", label: "Barbeiros" },
  { to: "/admin/agendamentos", label: "Agendamentos" }
];

const barberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  fullName: z.string().min(3),
  phone: z.string().min(10),
  bio: z.string().min(10),
  specialties: z.string().min(3)
});

type BarberValues = z.infer<typeof barberSchema>;

export function AdminBarbeiros() {
  const { barbeirosAdmin, loading, salvar, alternarStatus, resetarSenha, excluir } = useBarbeiros(true, true);
  const [selected, setSelected] = useState<BarbeiroAdmin | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<BarberValues>({
    resolver: zodResolver(barberSchema)
  });

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  function openForm(barber?: BarbeiroAdmin) {
    setSelected(barber ?? null);
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarError("");
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }
    reset({
      email: barber?.email ?? "",
      password: "",
      fullName: barber?.fullName ?? "",
      phone: barber?.phone ?? "",
      bio: barber?.bio ?? "",
      specialties: barber?.specialties.join(", ") ?? ""
    });
    setOpen(true);
  }

  const watchedName = watch("fullName");
  const displayedAvatarUrl = removeAvatar ? null : avatarPreviewUrl ?? selected?.avatarUrl ?? null;

  function handleAvatarFileChange(file: File | null) {
    if (!file) {
      setAvatarFile(null);
      setAvatarError("");
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);
      return;
    }

    try {
      validateBarberAvatarFile(file);
      const nextPreview = createObjectPreview(file);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarFile(file);
      setAvatarPreviewUrl(nextPreview);
      setRemoveAvatar(false);
      setAvatarError("");
    } catch (error) {
      setAvatarError(formatSupabaseError(error));
    }
  }

  return (
    <div className="pb-16">
      <Navbar
        authenticated
        links={adminLinks}
        subtitle="Criar usuário Auth, editar dados públicos, resetar senha e excluir perfil."
        title="Admin Barbeiros"
      />
      <main className="shell mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <BotaoVoltar to="/admin" />
          <button className="btn-primary" onClick={() => openForm()} type="button">
            Novo barbeiro
          </button>
        </div>
        {loading ? <Spinner /> : null}
        <div className="grid gap-4">
          {barbeirosAdmin.map((barber) => (
            <article key={barber.id} className="surface-elevated p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <BarberAvatar className="h-20 w-20" imageUrl={barber.avatarUrl} initialsClassName="text-2xl" name={barber.name} />
                  <div>
                    <h3 className="font-display text-4xl text-[#f0ede6]">{barber.name}</h3>
                    <p className="mt-1 text-sm text-[rgba(240,237,230,0.62)]">{barber.email}</p>
                    <p className="mt-2 text-sm text-[rgba(240,237,230,0.5)]">{barber.specialties.join(" • ")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary px-4 py-2" onClick={() => openForm(barber)} type="button">
                    Editar
                  </button>
                  <button
                    className="btn-secondary px-4 py-2"
                    disabled={deletingId === barber.profileId}
                    onClick={() => void alternarStatus(barber.profileId, !barber.isActive)}
                    type="button"
                  >
                    {barber.isActive ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="btn-secondary px-4 py-2"
                    disabled={deletingId === barber.profileId}
                    onClick={async () => {
                      const password = window.prompt("Nova senha para o barbeiro:");
                      if (!password) {
                        return;
                      }

                      try {
                        await resetarSenha(barber.profileId, password);
                        toast.success("Senha resetada.");
                      } catch (error) {
                        toast.error(formatSupabaseError(error));
                      }
                    }}
                    type="button"
                  >
                    Resetar senha
                  </button>
                  <button
                    className="btn-secondary bg-[#3a1616] px-4 py-2 text-[#f6d7d7] hover:bg-[#512020]"
                    disabled={deletingId === barber.profileId}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        `Excluir em definitivo o perfil de "${barber.name}"?\n\nEssa acao remove o acesso e o cadastro vinculado. Se existirem agendamentos ligados a esse barbeiro, a exclusao sera bloqueada.`
                      );

                      if (!confirmed) {
                        return;
                      }

                      setDeletingId(barber.profileId);
                      try {
                        await excluir(barber.profileId);
                        toast.success("Perfil excluido.");
                        if (selected?.profileId === barber.profileId) {
                          setOpen(false);
                          setSelected(null);
                        }
                      } catch (error) {
                        toast.error(formatSupabaseError(error));
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    type="button"
                  >
                    {deletingId === barber.profileId ? "Excluindo perfil..." : "Excluir perfil"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Modal onClose={() => setOpen(false)} open={open} title={selected ? "Editar barbeiro" : "Novo barbeiro"}>
        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values, event) => {
            setSubmitting(true);
            try {
              if (!selected && !values.password) {
                throw new Error("Senha inicial obrigatoria para novo barbeiro.");
              }

              await salvar(
                {
                  id: selected?.profileId,
                  email: values.email,
                  password: values.password || undefined,
                  fullName: values.fullName,
                  phone: values.phone,
                  avatarUrl: removeAvatar ? null : selected?.avatarUrl ?? null,
                  isActive: selected?.isActive ?? true,
                  barber: {
                    id: selected?.id,
                    name: values.fullName,
                    bio: values.bio,
                    phone: values.phone,
                    avatarUrl: removeAvatar ? null : selected?.avatarUrl ?? null,
                    specialties: values.specialties.split(",").map((item) => item.trim()).filter(Boolean),
                    isActive: selected?.isActive ?? true
                  }
                },
                {
                  avatarFile,
                  removeAvatar
                }
              );
              toast.success("Barbeiro salvo.");
              setAvatarFile(null);
              setRemoveAvatar(false);
              setAvatarError("");
              if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarPreviewUrl(null);
              }
              setOpen(false);
            } catch (error) {
              toast.error(formatSupabaseError(error));
            } finally {
              setSubmitting(false);
            }
          })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input className="field" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="label">Senha inicial / nova senha</label>
              <input className="field" type="password" {...register("password")} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Nome</label>
              <input className="field" {...register("fullName")} />
              {errors.fullName ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.fullName.message}</p> : null}
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="field" {...register("phone")} />
              {errors.phone ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.phone.message}</p> : null}
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="field min-h-28" {...register("bio")} />
            {errors.bio ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.bio.message}</p> : null}
          </div>
          <div>
            <label className="label">Especialidades</label>
            <input className="field" {...register("specialties")} />
            {errors.specialties ? <p className="mt-1 text-xs text-[#d09c9c]">{errors.specialties.message}</p> : null}
          </div>
          <BarberAvatarField
            barberName={watchedName || selected?.name || "Novo barbeiro"}
            disabled={submitting}
            error={avatarError}
            helperText={removeAvatar ? "A foto atual sera removida quando o cadastro for salvo." : avatarFile ? "Preview carregado. Salve para aplicar a nova foto." : "Admin pode trocar ou remover a foto do barbeiro a qualquer momento."}
            imageUrl={displayedAvatarUrl}
            previewLabel={
              avatarFile
                ? `${avatarFile.name} pronto para recorte automatico e exibicao consistente.`
                : displayedAvatarUrl
                  ? "A mesma foto sera reutilizada na lista, nos cards e no perfil."
                  : undefined
            }
            onFileChange={handleAvatarFileChange}
            onRemove={() => {
              setAvatarFile(null);
              setAvatarError("");
              if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarPreviewUrl(null);
              }
              setRemoveAvatar(Boolean(selected?.avatarUrl));
            }}
          />
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Salvando..." : "Salvar barbeiro"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
