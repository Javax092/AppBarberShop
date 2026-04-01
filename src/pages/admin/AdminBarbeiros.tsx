import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
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

type PendingAction = {
  type: "toggle" | "delete" | "reset-password";
  profileId: string;
};

type ConfirmAction =
  | {
      type: "toggle";
      barber: BarbeiroAdmin;
      nextIsActive: boolean;
    }
  | {
      type: "delete";
      barber: BarbeiroAdmin;
    }
  | null;

function TinySpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m12 6 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M7.8 5.8a8 8 0 1 0 8.4 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M10 11v5M14 11v5M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M14 7a4 4 0 1 1-3.46 6H4v4h3v2h3v-2h2.54A4 4 0 0 1 14 7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ActionButton({
  tone,
  busy,
  disabled,
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone: "neutral" | "warning" | "danger";
  busy?: boolean;
  icon: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const toneClassName =
    tone === "danger"
      ? "border border-[rgba(229,89,89,0.34)] bg-[rgba(112,25,25,0.58)] text-[#ffd7d7] hover:bg-[rgba(136,28,28,0.68)]"
      : tone === "warning"
        ? "border border-[rgba(232,151,71,0.34)] bg-[rgba(105,64,18,0.62)] text-[#ffe2b8] hover:bg-[rgba(127,78,19,0.74)]"
        : "border border-[rgba(240,237,230,0.12)] bg-[rgba(240,237,230,0.06)] text-[#f0ede6] hover:bg-[rgba(240,237,230,0.12)]";

  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClassName}`}
      disabled={disabled || busy}
      {...props}
      type={props.type ?? "button"}
    >
      {busy ? <TinySpinner /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function AdminBarbeiros() {
  const { barbeirosAdmin, loading, salvar, alternarStatus, resetarSenha, excluir } = useBarbeiros(true, true);
  const [selected, setSelected] = useState<BarbeiroAdmin | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const actionDebounceRef = useRef<Record<string, number>>({});

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
  const selectedProfileId = selected?.profileId ?? null;
  const anyActionInFlight = pendingAction !== null;

  const selectedCardStatus = useMemo(() => {
    if (!selectedProfileId) {
      return null;
    }

    return barbeirosAdmin.find((item) => item.profileId === selectedProfileId) ?? null;
  }, [barbeirosAdmin, selectedProfileId]);

  function isCoolingDown(actionKey: string) {
    const now = Date.now();
    const lastRunAt = actionDebounceRef.current[actionKey] ?? 0;

    if (now - lastRunAt < 800) {
      return true;
    }

    actionDebounceRef.current[actionKey] = now;
    return false;
  }

  function closeConfirmModal() {
    if (anyActionInFlight) {
      return;
    }

    setConfirmAction(null);
  }

  async function handleToggleStatus(barber: BarbeiroAdmin, nextIsActive: boolean) {
    const actionKey = `toggle:${barber.profileId}:${nextIsActive}`;
    if (isCoolingDown(actionKey)) {
      return;
    }

    setPendingAction({ type: "toggle", profileId: barber.profileId });
    try {
      await alternarStatus(barber.profileId, nextIsActive);
      toast.success(nextIsActive ? "Barbeiro ativado com sucesso." : "Barbeiro desativado com sucesso.");
      setConfirmAction(null);

      if (selected?.profileId === barber.profileId) {
        setSelected((current) => (current ? { ...current, isActive: nextIsActive } : current));
      }
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteProfile(barber: BarbeiroAdmin) {
    const actionKey = `delete:${barber.profileId}`;
    if (isCoolingDown(actionKey)) {
      return;
    }

    setPendingAction({ type: "delete", profileId: barber.profileId });
    try {
      await excluir(barber.profileId);
      toast.success("Barbeiro excluido em definitivo.");
      setConfirmAction(null);

      if (selected?.profileId === barber.profileId) {
        setOpen(false);
        setSelected(null);
      }
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResetPassword(barber: BarbeiroAdmin) {
    const password = window.prompt(`Nova senha para ${barber.name}:`);
    if (!password) {
      return;
    }

    const actionKey = `reset-password:${barber.profileId}`;
    if (isCoolingDown(actionKey)) {
      return;
    }

    setPendingAction({ type: "reset-password", profileId: barber.profileId });
    try {
      await resetarSenha(barber.profileId, password);
      toast.success("Senha interna atualizada.");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setPendingAction(null);
    }
  }

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
        subtitle="Gerencie barbeiros internos, disponibilidade pública e credenciais internas sem depender de auth.users."
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
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          barber.isActive
                            ? "bg-[rgba(54,179,126,0.16)] text-[#8ff0b5]"
                            : "bg-[rgba(220,72,72,0.14)] text-[#ffb0b0]"
                        }`}
                      >
                        {barber.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <span className="text-xs text-[rgba(240,237,230,0.46)]">
                        {barber.isActive
                          ? "Disponivel para lista publica e novos agendamentos."
                          : "Oculto do publico e bloqueado para novos agendamentos."}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton icon={<PencilIcon />} onClick={() => openForm(barber)} tone="neutral">
                    Editar
                  </ActionButton>
                  <ActionButton
                    busy={pendingAction?.type === "toggle" && pendingAction.profileId === barber.profileId}
                    disabled={anyActionInFlight}
                    icon={<PowerIcon />}
                    onClick={() => setConfirmAction({ type: "toggle", barber, nextIsActive: !barber.isActive })}
                    tone="warning"
                  >
                    {barber.isActive ? "Desativar" : "Ativar"}
                  </ActionButton>
                  <ActionButton
                    busy={pendingAction?.type === "reset-password" && pendingAction.profileId === barber.profileId}
                    disabled={anyActionInFlight}
                    icon={<KeyIcon />}
                    onClick={() => void handleResetPassword(barber)}
                    tone="neutral"
                  >
                    Resetar senha
                  </ActionButton>
                  <ActionButton
                    busy={pendingAction?.type === "delete" && pendingAction.profileId === barber.profileId}
                    disabled={anyActionInFlight}
                    icon={<TrashIcon />}
                    onClick={() => setConfirmAction({ type: "delete", barber })}
                    tone="danger"
                  >
                    Excluir barbeiro
                  </ActionButton>
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
                  isActive: selectedCardStatus?.isActive ?? selected?.isActive ?? true,
                  barber: {
                    id: selected?.id,
                    name: values.fullName,
                    bio: values.bio,
                    phone: values.phone,
                    avatarUrl: removeAvatar ? null : selected?.avatarUrl ?? null,
                    specialties: values.specialties.split(",").map((item) => item.trim()).filter(Boolean),
                    isActive: selectedCardStatus?.isActive ?? selected?.isActive ?? true
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

      <Modal
        onClose={closeConfirmModal}
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "delete" ? "Excluir Barbeiro" : "Alterar Status do Barbeiro"}
      >
        {confirmAction ? (
          <div className="space-y-5">
            <div className="rounded-[20px] border border-[rgba(240,237,230,0.08)] bg-[rgba(240,237,230,0.03)] p-4">
              <p className="text-sm text-[rgba(240,237,230,0.82)]">
                {confirmAction.type === "delete"
                  ? "Tem certeza que deseja excluir este barbeiro? A exclusao fisica so sera permitida se nao houver dependencias ativas."
                  : confirmAction.nextIsActive
                    ? "Deseja reativar este barbeiro agora? O perfil volta para a lista publica e aceita novos agendamentos."
                    : "Deseja desativar temporariamente este barbeiro? Ele saira da lista publica e nao podera receber novos agendamentos."}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[rgba(240,237,230,0.48)]">
                Perfil: {confirmAction.barber.name}
              </p>
              {confirmAction.type === "delete" ? (
                <p className="mt-2 text-xs text-[rgba(240,237,230,0.56)]">
                  O backend exige sessao real do admin e retorna conflito quando existir historico, servicos, horarios ou bloqueios vinculados.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button className="btn-secondary px-4 py-2" disabled={anyActionInFlight} onClick={closeConfirmModal} type="button">
                Cancelar
              </button>
              {confirmAction.type === "toggle" ? (
                <ActionButton
                  busy={pendingAction?.type === "toggle" && pendingAction.profileId === confirmAction.barber.profileId}
                  disabled={anyActionInFlight}
                  icon={<PowerIcon />}
                  onClick={() => void handleToggleStatus(confirmAction.barber, confirmAction.nextIsActive)}
                  tone="warning"
                >
                  {confirmAction.nextIsActive ? "Ativar barbeiro" : "Desativar barbeiro"}
                </ActionButton>
              ) : (
                <ActionButton
                  busy={pendingAction?.type === "delete" && pendingAction.profileId === confirmAction.barber.profileId}
                  disabled={anyActionInFlight}
                  icon={<TrashIcon />}
                  onClick={() => void handleDeleteProfile(confirmAction.barber)}
                  tone="danger"
                >
                  Excluir em definitivo
                </ActionButton>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
