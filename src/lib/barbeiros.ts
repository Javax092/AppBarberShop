import { fileToBase64, validateBarberAvatarFile } from "./avatar.ts";
import type {
  AuthProfile,
  Barbeiro,
  BarbeiroAdmin,
  BarbeiroPayload,
  HorarioDisponibilidade,
  ScheduleBlock
} from "../types/index.ts";
import {
  MANAGE_BARBER_AVATAR_FUNCTION,
  MANAGE_STAFF_FUNCTION,
  ensureValidSupabaseSession,
  getPublicUrl,
  getSupabaseFunctionUrl,
  invokeSupabaseFunction,
  supabase
} from "./supabase.ts";

interface BarberRow {
  id: string;
  name: string;
  bio: string;
  phone: string | null;
  avatar_url: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AvailabilityRow {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ScheduleBlockRow {
  id: string;
  barber_id: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BarberAdminRow {
  id: string;
  email: string;
  full_name: string;
  barbers: BarberRow | null;
}

interface ManageStaffUpsertResult {
  error?: string;
  staff?: {
    id: string;
  };
  barberId?: string | null;
}

export interface UpsertBarbeiroResult {
  profileId: string;
  barberId: string | null;
}

interface AvatarMutationOptions {
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

interface ManageBarberAvatarResult {
  avatarPath: string | null;
  publicUrl: string | null;
}

function mapBarber(row: BarberRow): Barbeiro {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    phone: row.phone,
    avatarUrl: getPublicUrl(row.avatar_url),
    specialties: row.specialties ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAvailability(row: AvailabilityRow): HorarioDisponibilidade {
  return {
    id: row.id,
    barberId: row.barber_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    slotIntervalMinutes: row.slot_interval_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  return {
    id: row.id,
    barberId: row.barber_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    label: row.label,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeStoragePath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      const marker = "/object/public/";
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        return decodeURIComponent(url.pathname.slice(markerIndex + marker.length).split("/").slice(1).join("/"));
      }
    } catch {
      return null;
    }
  }

  return path;
}

async function extractEdgeFunctionMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const response = "context" in error ? (error as Error & { context?: Response }).context : undefined;
  if (!response || typeof response.clone !== "function") {
    return null;
  }

  try {
    const cloned = response.clone();
    const contentType = cloned.headers.get("content-type") ?? "";
    const statusLabel = cloned.status ? ` (HTTP ${cloned.status})` : "";

    if (contentType.includes("application/json")) {
      const payload = (await cloned.json()) as { error?: string; message?: string } | string;
      const message =
        typeof payload === "string" ? payload : payload?.error ?? payload?.message ?? "";

      if (message) {
        return `${message}${statusLabel}`;
      }
    }

    const text = (await cloned.text()).trim();
    if (text) {
      return `${text}${statusLabel}`;
    }
  } catch {
    return null;
  }

  return null;
}

async function throwEdgeFunctionError(error: unknown): Promise<never> {
  const message = await extractEdgeFunctionMessage(error);
  if (message) {
    throw new Error(message);
  }

  if (error instanceof Error) {
    throw new Error(error.message);
  }

  throw new Error("Falha ao executar a Edge Function.");
}

async function callBarberAvatarManager(
  body: Record<string, unknown>,
  sessionProfile?: AuthProfile | null
): Promise<ManageBarberAvatarResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  if (sessionProfile?.authMode !== "app_users") {
    const session = await ensureValidSupabaseSession();
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(getSupabaseFunctionUrl(MANAGE_BARBER_AVATAR_FUNCTION), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? ((await response.json()) as Record<string, unknown>) : {};

  if (!response.ok) {
    const message =
      (typeof payload.error === "string" && payload.error) ||
      (typeof payload.message === "string" && payload.message) ||
      "Falha ao atualizar a foto do barbeiro.";

    throw new Error(message);
  }

  return {
    avatarPath: typeof payload.avatarPath === "string" ? payload.avatarPath : null,
    publicUrl: typeof payload.publicUrl === "string" ? payload.publicUrl : null
  };
}

async function uploadBarberAvatar(
  profileId: string,
  file: File,
  sessionProfile?: AuthProfile | null
) {
  const { mimeType, extension } = validateBarberAvatarFile(file);
  const imageBase64 = await fileToBase64(file);

  return callBarberAvatarManager(
    {
      action: "upload",
      targetProfileId: profileId,
      imageBase64,
      mimeType,
      extension,
      fallbackEmail: sessionProfile?.authMode === "app_users" ? sessionProfile.email : undefined,
      fallbackPassword: sessionProfile?.authMode === "app_users" ? sessionProfile.fallbackSecret ?? "" : undefined
    },
    sessionProfile
  );
}

export async function removeBarberAvatar(profileId: string, sessionProfile?: AuthProfile | null) {
  return callBarberAvatarManager(
    {
      action: "remove",
      targetProfileId: profileId,
      fallbackEmail: sessionProfile?.authMode === "app_users" ? sessionProfile.email : undefined,
      fallbackPassword: sessionProfile?.authMode === "app_users" ? sessionProfile.fallbackSecret ?? "" : undefined
    },
    sessionProfile
  );
}

export async function listBarbeiros(includeInactive = false, barberId?: string) {
  let query = supabase.from("barbers").select("*").order("name");
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }
  if (barberId) {
    query = query.eq("id", barberId);
  }

  const { data, error } = await query.returns<BarberRow[]>();
  if (error) {
    await throwEdgeFunctionError(error);
  }

  return data.map(mapBarber);
}

export async function listDisponibilidade(barberId?: string) {
  let query = supabase.from("barber_availability").select("*").order("day_of_week").order("start_time");
  if (barberId) {
    query = query.eq("barber_id", barberId);
  }

  const { data, error } = await query.returns<AvailabilityRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapAvailability);
}

export async function listScheduleBlocks(barberId?: string) {
  let query = supabase.from("schedule_blocks").select("*").eq("is_active", true).order("start_time");

  if (barberId) {
    query = query.or(`barber_id.is.null,barber_id.eq.${barberId}`);
  }

  const { data, error } = await query.returns<ScheduleBlockRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapScheduleBlock);
}

export async function listBarbeirosAdmin() {
  await ensureValidSupabaseSession();

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, email, full_name, barbers:barber_id (*)")
    .eq("role", "barber")
    .order("full_name")
    .returns<BarberAdminRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data
    .filter((item) => item.barbers)
    .map((item) => {
      const barber = mapBarber(item.barbers as BarberRow);
      const result: BarbeiroAdmin = {
        ...barber,
        profileId: item.id,
        email: item.email,
        fullName: item.full_name
      };
      return result;
    });
}

export async function upsertBarbeiro(
  payload: BarbeiroPayload,
  options?: AvatarMutationOptions,
  sessionProfile?: AuthProfile | null
): Promise<UpsertBarbeiroResult> {
  const invokeUpsert = async (avatarPath: string | null | undefined, userId = payload.id, barberId = payload.barber.id) => {
    const { data, error } = await invokeSupabaseFunction<ManageStaffUpsertResult>(MANAGE_STAFF_FUNCTION, {
      action: "upsert",
      staff: {
        id: userId,
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName,
        role: "barber",
        phone: payload.phone,
        avatarUrl: avatarPath,
        isActive: payload.isActive,
        barber: {
          id: barberId,
          name: payload.barber.name,
          bio: payload.barber.bio,
          phone: payload.barber.phone,
          avatarUrl: avatarPath,
          specialties: payload.barber.specialties,
          isActive: payload.barber.isActive
        }
      }
    });

    if (error) {
      await throwEdgeFunctionError(error);
    }

    const result = (data ?? {}) as ManageStaffUpsertResult;
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  };

  const nextAvatarPath = options?.removeAvatar ? null : normalizeStoragePath(payload.avatarUrl);
  const result = await invokeUpsert(nextAvatarPath);
  const profileId = result.staff?.id ?? payload.id ?? "";

  if (!profileId) {
    throw new Error("Nao foi possivel identificar o perfil do barbeiro salvo.");
  }

  if (options?.removeAvatar && payload.avatarUrl) {
    await removeBarberAvatar(profileId, sessionProfile);
  }

  if (options?.avatarFile) {
    await uploadBarberAvatar(profileId, options.avatarFile, sessionProfile);
  }

  return {
    profileId,
    barberId: result.barberId ?? payload.barber.id ?? null
  };
}

export async function updateOwnBarberProfileAppUser(
  sessionProfile: AuthProfile,
  payload: BarbeiroPayload,
  avatarUrl?: string | null
): Promise<UpsertBarbeiroResult> {
  const { error } = await supabase.rpc("update_own_barber_profile_app_user", {
    input_email: sessionProfile.email,
    input_password: sessionProfile.fallbackSecret ?? "",
    input_full_name: payload.fullName,
    input_phone: payload.phone,
    input_avatar_url: avatarUrl ?? payload.avatarUrl ?? null,
    input_bio: payload.barber.bio,
    input_specialties: payload.barber.specialties
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profileId: sessionProfile.id,
    barberId: sessionProfile.barberId
  };
}

export async function saveOwnBarberProfile(
  sessionProfile: AuthProfile,
  payload: BarbeiroPayload,
  options?: AvatarMutationOptions
) {
  if (sessionProfile.role !== "barber" || !sessionProfile.barberId) {
    throw new Error("Somente barbeiros com perfil vinculado podem editar o proprio cadastro.");
  }

  const profileId = payload.id ?? sessionProfile.id;
  const barberId = payload.barber.id ?? sessionProfile.barberId;

  if (profileId !== sessionProfile.id || barberId !== sessionProfile.barberId) {
    throw new Error("Voce so pode editar o proprio perfil de barbeiro.");
  }

  let nextAvatarPath = options?.removeAvatar ? null : normalizeStoragePath(payload.avatarUrl);

  if (options?.removeAvatar && payload.avatarUrl) {
    await removeBarberAvatar(profileId, sessionProfile);
    nextAvatarPath = null;
  }

  if (options?.avatarFile) {
    const uploadResult = await uploadBarberAvatar(profileId, options.avatarFile, sessionProfile);
    nextAvatarPath = uploadResult.avatarPath;
  }

  const nextPayload = {
    ...payload,
    id: sessionProfile.id,
    avatarUrl: nextAvatarPath,
    barber: {
      ...payload.barber,
      id: sessionProfile.barberId,
      avatarUrl: nextAvatarPath
    }
  };

  if (sessionProfile.authMode === "app_users") {
    return updateOwnBarberProfileAppUser(sessionProfile, nextPayload, nextAvatarPath);
  }

  await ensureValidSupabaseSession();

  const { error: profileError } = await supabase
    .from("staff_profiles")
    .update({
      full_name: nextPayload.fullName.trim(),
      phone: nextPayload.phone?.trim() || null,
      avatar_url: nextAvatarPath
    })
    .eq("id", sessionProfile.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: barberError } = await supabase
    .from("barbers")
    .update({
      name: nextPayload.fullName.trim(),
      bio: nextPayload.barber.bio,
      phone: nextPayload.phone?.trim() || null,
      avatar_url: nextAvatarPath,
      specialties: nextPayload.barber.specialties
    })
    .eq("id", sessionProfile.barberId);

  if (barberError) {
    throw new Error(barberError.message);
  }

  return {
    profileId: sessionProfile.id,
    barberId: sessionProfile.barberId
  };
}

export async function toggleBarbeiro(profileId: string, isActive: boolean) {
  const { data, error } = await invokeSupabaseFunction<{ error?: string }>(MANAGE_STAFF_FUNCTION, {
    action: "toggle-active",
    staff: {
      id: profileId,
      isActive
    }
  });

  if (error) {
    await throwEdgeFunctionError(error);
  }

  const result = data as { error?: string };
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function resetSenhaBarbeiro(profileId: string, password: string) {
  const { data, error } = await invokeSupabaseFunction<{ error?: string }>(MANAGE_STAFF_FUNCTION, {
    action: "reset-password",
    staff: {
      id: profileId,
      password
    }
  });

  if (error) {
    await throwEdgeFunctionError(error);
  }

  const result = data as { error?: string };
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function excluirBarbeiro(profileId: string) {
  const { data, error } = await invokeSupabaseFunction<{ error?: string }>(MANAGE_STAFF_FUNCTION, {
    action: "delete",
    staff: {
      id: profileId
    }
  });

  if (error) {
    await throwEdgeFunctionError(error);
  }

  const result = data as { error?: string };
  if (result.error) {
    throw new Error(result.error);
  }
}

export async function upsertDisponibilidade(
  barberId: string,
  disponibilidade: Array<Partial<Pick<HorarioDisponibilidade, "id">> & Pick<HorarioDisponibilidade, "dayOfWeek" | "startTime" | "endTime" | "slotIntervalMinutes" | "isActive">>,
  sessionProfile?: AuthProfile | null
) {
  await ensureValidSupabaseSession();

  const rows = disponibilidade.map((item) => ({
    id: item.id ?? crypto.randomUUID(),
    barber_id: barberId || sessionProfile?.barberId || "",
    day_of_week: item.dayOfWeek,
    start_time: item.startTime,
    end_time: item.endTime,
    slot_interval_minutes: item.slotIntervalMinutes,
    is_active: item.isActive
  }));

  const targetBarberId = barberId || sessionProfile?.barberId || "";
  if (!targetBarberId) {
    throw new Error("Barbeiro nao identificado para salvar disponibilidade.");
  }

  const { error: deleteError } = await supabase.from("barber_availability").delete().eq("barber_id", targetBarberId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("barber_availability").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}
