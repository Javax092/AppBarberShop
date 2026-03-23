import type { Session } from "@supabase/supabase-js";

import type { AuthProfile, PerfilAcesso } from "../types/index.ts";
import { PASSWORD_RESET_REDIRECT, recoverFromSupabaseSessionError, supabase } from "./supabase.ts";

export const HARDCODED_ADMIN_EMAIL = "ryanlmxxv@gmail.com";
export const HARDCODED_ADMIN_PASSWORD = "904721Rl";
const FALLBACK_SESSION_KEY = "appmobilebarbearia.app-user-session";

interface StaffProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: PerfilAcesso;
  phone: string | null;
  avatar_url: string | null;
  barber_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class ProfileSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileSyncError";
  }
}

interface FallbackSessionRow {
  user_id: string;
  email: string;
  full_name: string;
  role: PerfilAcesso;
  phone: string | null;
  avatar_url: string | null;
  barber_id: string | null;
  is_active: boolean;
}

function loadFallbackSession() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(FALLBACK_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthProfile;
  } catch {
    localStorage.removeItem(FALLBACK_SESSION_KEY);
    return null;
  }
}

function storeFallbackSession(profile: AuthProfile) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(profile));
}

function clearFallbackSession() {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(FALLBACK_SESSION_KEY);
}

function getRecoveryUrlState() {
  if (typeof window === "undefined") {
    return {
      code: null,
      searchType: null,
      hashType: null,
      hasRecoveryTokens: false
    };
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return {
    code: url.searchParams.get("code"),
    searchType: url.searchParams.get("type"),
    hashType: hashParams.get("type"),
    hasRecoveryTokens:
      hashParams.has("access_token") || hashParams.has("refresh_token") || url.searchParams.has("token_hash")
  };
}

function mapFallbackProfile(row: FallbackSessionRow, fallbackSecret: string): AuthProfile {
  const now = new Date().toISOString();

  return {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    barberId: row.barber_id,
    isActive: row.is_active,
    createdAt: now,
    updatedAt: now,
    authMode: "app_users",
    fallbackSecret
  };
}

async function authenticateFallbackStaff(email: string, password: string, role: PerfilAcesso) {
  const { data, error } = await supabase.rpc("authenticate_staff", {
    input_email: email.trim().toLowerCase(),
    input_password: password,
    input_role: role
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as FallbackSessionRow | null;
  if (!row?.user_id) {
    throw new Error("Nao foi possivel autenticar com as credenciais informadas.");
  }

  const profile = mapFallbackProfile(row, password);
  storeFallbackSession(profile);
  return profile;
}

export function getStoredAppUserSession() {
  return loadFallbackSession();
}

export function hasPasswordRecoveryInUrl() {
  const recovery = getRecoveryUrlState();

  return Boolean(
    recovery.code ||
      recovery.searchType === "recovery" ||
      recovery.hashType === "recovery" ||
      recovery.hasRecoveryTokens
  );
}

function mapProfile(row: StaffProfileRow): AuthProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    barberId: row.barber_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function isHardcodedAdminEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase() === HARDCODED_ADMIN_EMAIL;
}

function buildHardcodedAdminProfile(session: Session, profile?: Partial<AuthProfile>): AuthProfile {
  const now = new Date().toISOString();

  return {
    id: session.user.id,
    email: session.user.email?.trim().toLowerCase() || HARDCODED_ADMIN_EMAIL,
    fullName: profile?.fullName || session.user.user_metadata?.full_name || "Administrador",
    role: "admin",
    phone: profile?.phone ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    barberId: null,
    isActive: true,
    createdAt: profile?.createdAt || now,
    updatedAt: now
  };
}

export async function getSession() {
  const attempt = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return data.session;
  };

  try {
    return await attempt();
  } catch (error) {
    const recovered = await recoverFromSupabaseSessionError(error);
    if (recovered) {
      return attempt();
    }

    throw new Error(error instanceof Error ? error.message : "Falha ao carregar a sessao.");
  }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new ProfileSyncError(
        "Usuario autenticado, mas sem cadastro em staff_profiles. Sincronize o usuario no painel admin antes de acessar esta area."
      );
    }

    throw new Error(error.message);
  }

  const profile = mapProfile(data as StaffProfileRow);

  if (profile.role === "barber" && !profile.barberId) {
    throw new ProfileSyncError(
      "Perfil com role barber esta sem barber_id vinculado. Corrija o cadastro da equipe no painel admin."
    );
  }

  return profile;
}

export async function getProfileForSession(session: Session) {
  try {
    const profile = await getProfile(session.user.id);

    if (isHardcodedAdminEmail(profile.email) || isHardcodedAdminEmail(session.user.email)) {
      return buildHardcodedAdminProfile(session, profile);
    }

    return profile;
  } catch (error) {
    if (isHardcodedAdminEmail(session.user.email)) {
      return buildHardcodedAdminProfile(session);
    }

    throw error;
  }
}

export async function signInWithRole(email: string, password: string, role: PerfilAcesso) {
  let authError: Error | null = null;
  let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["data"] | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await supabase.auth.signInWithPassword({ email, password });

    if (!response.error) {
      data = response.data;
      authError = null;
      break;
    }

    authError = response.error;
    const recovered = attempt === 0 ? await recoverFromSupabaseSessionError(response.error) : false;
    if (!recovered) {
      break;
    }
  }

  if (authError) {
    const shouldFallbackToAppUsers =
      role === "barber" &&
      (authError.message?.includes("Database error querying schema") ||
        authError.message?.includes("Invalid login credentials") ||
        authError.message?.includes("unexpected_failure"));

    if (shouldFallbackToAppUsers) {
      const fallbackProfile = await authenticateFallbackStaff(email, password, role);
      return {
        session: null,
        profile: fallbackProfile
      };
    }

    throw new Error(authError.message);
  }

  const session = data?.session;
  if (!session) {
    throw new Error("Sessao nao encontrada.");
  }

  const profile = await getProfileForSession(session);
  const isHardcodedAdminLogin =
    role === "admin" &&
    isHardcodedAdminEmail(email) &&
    password === HARDCODED_ADMIN_PASSWORD &&
    isHardcodedAdminEmail(session.user.email);

  if (isHardcodedAdminLogin) {
    clearFallbackSession();
    return { session, profile: buildHardcodedAdminProfile(session, profile) };
  }

  if (profile.role !== role) {
    await supabase.auth.signOut();
    throw new Error("Perfil sem permissao para esta area.");
  }

  if (!profile.isActive) {
    await supabase.auth.signOut();
    throw new Error("Usuario inativo.");
  }

  clearFallbackSession();
  return { session, profile };
}

export async function signOut() {
  clearFallbackSession();

  const { error } = await supabase.auth.signOut();
  if (error) {
    const recovered = await recoverFromSupabaseSessionError(error);
    if (!recovered) {
      throw new Error(error.message);
    }
  }
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RESET_REDIRECT
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function preparePasswordRecoverySession() {
  const recovery = getRecoveryUrlState();

  if (!recovery.code && recovery.searchType !== "recovery" && recovery.hashType !== "recovery" && !recovery.hasRecoveryTokens) {
    return false;
  }

  if (recovery.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(recovery.code);
    if (error) {
      const recovered = await recoverFromSupabaseSessionError(error);
      if (recovered) {
        throw new Error("Seu link de recuperacao expirou. Solicite outro.");
      }

      throw new Error(error.message);
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    const recovered = await recoverFromSupabaseSessionError(error);
    if (recovered) {
      throw new Error("Seu link de recuperacao expirou. Solicite outro.");
    }

    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error("Seu link de recuperacao e invalido ou expirou. Solicite outro.");
  }

  return true;
}

export async function finishPasswordRecovery(password: string) {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const recovered = await recoverFromSupabaseSessionError(error);
    if (recovered) {
      throw new Error("Sua sessao de recuperacao expirou. Solicite um novo link.");
    }

    throw new Error(error.message);
  }
}

export function onAuthStateChange(callback: (session: Session | null) => Promise<void> | void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    void callback(session);
  });
}
