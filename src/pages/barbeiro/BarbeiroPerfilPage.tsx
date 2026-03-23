import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { BarberAvatarField } from "../../components/barbeiro/BarberAvatarField.tsx";
import { BotaoVoltar } from "../../components/layout/BotaoVoltar.tsx";
import { Navbar } from "../../components/layout/Navbar.tsx";
import { Spinner } from "../../components/ui/Spinner.tsx";
import { useAuth } from "../../hooks/useAuth.tsx";
import { useBarbeiros } from "../../hooks/useBarbeiros.ts";
import { createObjectPreview, validateBarberAvatarFile } from "../../lib/avatar.ts";
import { upsertDisponibilidade } from "../../lib/barbeiros.ts";
import { formatSupabaseError } from "../../lib/supabase.ts";

const profileSchema = z.object({
  fullName: z.string().min(3),
  bio: z.string().min(10),
  phone: z.string().min(10),
  specialties: z.string().min(3)
});

type ProfileValues = z.infer<typeof profileSchema>;

const days = [
  { label: "Domingo", dayOfWeek: 0 },
  { label: "Segunda", dayOfWeek: 1 },
  { label: "Terça", dayOfWeek: 2 },
  { label: "Quarta", dayOfWeek: 3 },
  { label: "Quinta", dayOfWeek: 4 },
  { label: "Sexta", dayOfWeek: 5 },
  { label: "Sábado", dayOfWeek: 6 }
];

export function BarbeiroPerfilPage() {
  const { profile, refreshProfile } = useAuth();
  const { barbeiros, disponibilidade, salvar, loading, error } = useBarbeiros(true, false, profile);
  const barber = barbeiros.find((item) => item.id === profile?.barberId);
  const resolvedBarber =
    barber ??
    (profile?.barberId
      ? {
          id: profile.barberId,
          name: profile.fullName,
          bio: "",
          phone: profile.phone,
          avatarUrl: profile.avatarUrl,
          specialties: [],
          isActive: profile.isActive,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      : null);
  const currentAvailability = disponibilidade.filter((item) => item.barberId === profile?.barberId);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName ?? "",
      bio: resolvedBarber?.bio ?? "",
      phone: resolvedBarber?.phone ?? "",
      specialties: resolvedBarber?.specialties.join(", ") ?? ""
    }
  });

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  if (!profile) {
    return (
      <div className="shell pt-10">
        <Spinner />
      </div>
    );
  }

  if (!loading && !resolvedBarber) {
    return (
      <div className="pb-16">
        <Navbar authenticated links={[{ to: "/barbeiro", label: "Dashboard" }, { to: "/barbeiro/perfil", label: "Meu Perfil" }]} subtitle="Edite bio, foto e janelas de atendimento." title="Meu Perfil" />
        <main className="shell mt-8 space-y-6">
          <BotaoVoltar to="/barbeiro" />
          <section className="surface-elevated p-6 sm:p-7">
            <h2 className="font-display text-4xl text-[#f0ede6]">Perfil indisponível</h2>
            <p className="mt-3 text-sm text-[rgba(240,237,230,0.68)]">
              Seu cadastro foi autenticado, mas o barbeiro vinculado não foi carregado. Revise o vínculo `barber_id` no painel admin.
            </p>
            {error ? <p className="mt-3 text-sm text-[#d09c9c]">{error}</p> : null}
          </section>
        </main>
      </div>
    );
  }

  const displayedAvatarUrl = removeAvatar ? null : avatarPreviewUrl ?? resolvedBarber?.avatarUrl ?? null;
  const watchedName = watch("fullName");

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
      <Navbar authenticated links={[{ to: "/barbeiro", label: "Dashboard" }, { to: "/barbeiro/perfil", label: "Meu Perfil" }]} subtitle="Edite bio, foto e janelas de atendimento." title="Meu Perfil" />
      <main className="shell mt-8 space-y-6">
        <BotaoVoltar to="/barbeiro" />
        {loading ? <Spinner /> : null}
        {!loading && error ? (
          <div className="rounded-[20px] border border-[rgba(208,156,156,0.35)] bg-[rgba(208,156,156,0.08)] px-4 py-3 text-sm text-[#f3c6c6]">
            {error}
          </div>
        ) : null}
        <form
          className="surface-elevated grid gap-5 p-6 sm:p-7"
          onSubmit={handleSubmit(async (values, event) => {
            const formElement = event?.target;

            const availabilityRows = days.flatMap((day) => {
              const enabledField = formElement instanceof HTMLFormElement ? formElement.elements.namedItem(`enabled-${day.dayOfWeek}`) : null;
              const startField = formElement instanceof HTMLFormElement ? formElement.elements.namedItem(`start-${day.dayOfWeek}`) : null;
              const endField = formElement instanceof HTMLFormElement ? formElement.elements.namedItem(`end-${day.dayOfWeek}`) : null;
              const enabled = enabledField instanceof HTMLInputElement ? enabledField.checked : false;
              const start = startField instanceof HTMLInputElement ? startField.value : "";
              const end = endField instanceof HTMLInputElement ? endField.value : "";

              if (!enabled || !start || !end) {
                return [];
              }

              return [
                {
                  dayOfWeek: day.dayOfWeek,
                  startTime: `${start}:00`,
                  endTime: `${end}:00`,
                  slotIntervalMinutes: 30,
                  isActive: true
                }
              ];
            });

            try {
              await salvar(
                {
                  id: profile.id,
                  email: profile.email,
                  fullName: values.fullName,
                  phone: values.phone,
                  avatarUrl: removeAvatar ? null : resolvedBarber?.avatarUrl ?? null,
                  isActive: true,
                  barber: {
                    id: resolvedBarber?.id,
                    name: values.fullName,
                    bio: values.bio,
                    phone: values.phone,
                    avatarUrl: removeAvatar ? null : resolvedBarber?.avatarUrl ?? null,
                    specialties: values.specialties.split(",").map((item) => item.trim()).filter(Boolean),
                    isActive: true
                  }
                },
                {
                  avatarFile,
                  removeAvatar
                }
              );
              await upsertDisponibilidade(profile.barberId ?? resolvedBarber?.id ?? "", availabilityRows, profile);
              await refreshProfile();
              toast.success("Perfil atualizado.");
              setAvatarFile(null);
              setRemoveAvatar(false);
              setAvatarError("");
              if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
                setAvatarPreviewUrl(null);
              }
            } catch (error) {
              toast.error(formatSupabaseError(error));
            }
          })}
        >
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
            barberName={watchedName || resolvedBarber?.name || profile.fullName}
            disabled={isSubmitting}
            error={avatarError}
            helperText={removeAvatar ? "A foto atual sera removida quando voce salvar." : avatarFile ? "Preview carregado. Salve para aplicar a nova foto." : "Somente voce ou o admin podem alterar esta foto."}
            imageUrl={displayedAvatarUrl}
            previewLabel={
              avatarFile
                ? `${avatarFile.name} sera ajustado com corte elegante e proporcao fixa.`
                : displayedAvatarUrl
                  ? "Sua foto atual ja esta pronta para lista, card e perfil."
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
              setRemoveAvatar(Boolean(resolvedBarber?.avatarUrl));
            }}
          />
          <section className="rounded-[24px] border border-[rgba(201,169,110,0.12)] p-5">
            <h3 className="font-display text-4xl text-[#f0ede6]">Horários por dia</h3>
            <div className="mt-4 grid gap-4">
              {days.map((day) => {
                const existing = currentAvailability.find((item) => item.dayOfWeek === day.dayOfWeek);
                return (
                  <div key={day.dayOfWeek} className="grid gap-3 rounded-2xl border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.02)] p-4 md:grid-cols-[180px_1fr_1fr] md:items-center">
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#f0ede6]">
                      <input defaultChecked={Boolean(existing)} name={`enabled-${day.dayOfWeek}`} type="checkbox" />
                      {day.label}
                    </label>
                    <input className="field" defaultValue={existing?.startTime.slice(0, 5) ?? "09:00"} name={`start-${day.dayOfWeek}`} type="time" />
                    <input className="field" defaultValue={existing?.endTime.slice(0, 5) ?? "18:00"} name={`end-${day.dayOfWeek}`} type="time" />
                  </div>
                );
              })}
            </div>
          </section>
          <button className="btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </main>
    </div>
  );
}
