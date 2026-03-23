import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

if (!isSupabaseConfigured()) {
  throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "barbershop-assets";
export const MANAGE_STAFF_FUNCTION = import.meta.env.VITE_MANAGE_STAFF_FUNCTION || "manage-staff-user";
export const MANAGE_BARBER_AVATAR_FUNCTION = import.meta.env.VITE_MANAGE_BARBER_AVATAR_FUNCTION || "manage-barber-avatar";
export const PASSWORD_RESET_REDIRECT =
  import.meta.env.VITE_PASSWORD_RESET_REDIRECT || `${window.location.origin}/barbeiro/login`;
export const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
export const PUBLIC_IMAGES_BUCKET = STORAGE_BUCKET;
export const PUBLIC_IMAGES_FOLDER = "legacy";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

function clearPersistedSupabaseSession() {
  if (typeof localStorage === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("sb-")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
}

export function purgeLegacySupabaseStorage() {
  clearPersistedSupabaseSession();
}

function shouldRecoverFromSupabaseSessionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();

  return (
    message.includes("auth session missing") ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found") ||
    message.includes("jwt") ||
    message.includes("session")
  );
}

export async function recoverFromSupabaseSessionError(error: unknown) {
  if (!shouldRecoverFromSupabaseSessionError(error)) {
    return false;
  }

  clearPersistedSupabaseSession();

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best effort cleanup. Clearing the persisted auth state is enough to retry.
  }

  return true;
}

export async function ensureValidSupabaseSession() {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    const recovered = await recoverFromSupabaseSessionError(sessionError);
    if (recovered) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error("Sessao autenticada nao encontrada.");
  }

  const now = Math.floor(Date.now() / 1000);
  const shouldRefresh = typeof session.expires_at === "number" && session.expires_at <= now + 60;

  let activeSession = session;

  if (shouldRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      const recovered = await recoverFromSupabaseSessionError(error);
      if (recovered) {
        throw new Error("Sua sessao expirou. Entre novamente.");
      }

      throw new Error(error.message);
    }

    if (!data.session?.access_token) {
      throw new Error("Nao foi possivel renovar a sessao autenticada.");
    }

    activeSession = data.session;
  }

  const { error: validationError } = await supabase.auth.getUser(activeSession.access_token);
  if (!validationError) {
    return activeSession;
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshedData.session?.access_token) {
    const recovered = await recoverFromSupabaseSessionError(validationError);
    if (recovered) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    throw new Error(refreshError?.message ?? validationError.message);
  }

  const { error: refreshedValidationError } = await supabase.auth.getUser(refreshedData.session.access_token);
  if (refreshedValidationError) {
    const recovered = await recoverFromSupabaseSessionError(refreshedValidationError);
    if (recovered) {
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    throw new Error(refreshedValidationError.message);
  }

  return refreshedData.session;
}

export async function invokeSupabaseFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>
) {
  const session = await ensureValidSupabaseSession();

  return supabase.functions.invoke<TResponse>(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });
}

export function getSupabaseFunctionUrl(functionName: string) {
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

export function getPublicUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadImage(file: File, folder: string) {
  await ensureValidSupabaseSession();

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export function formatSupabaseError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

export interface StaffProfile {
  id: string;
  email: string;
  role: "admin" | "barber";
  is_active: boolean;
}

export interface AdminSessionState {
  session: import("@supabase/supabase-js").Session | null;
  profile: StaffProfile | null;
  isAdmin: boolean;
}
