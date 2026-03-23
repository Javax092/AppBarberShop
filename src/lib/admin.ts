import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  PUBLIC_IMAGES_BUCKET,
  PUBLIC_IMAGES_FOLDER,
  supabase,
  type AdminSessionState,
  type StaffProfile
} from "./supabase.ts";
import { HARDCODED_ADMIN_EMAIL } from "./auth.ts";

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface UploadImagemInput {
  file: File;
  folder?: string;
}

export interface UploadImagemResult {
  path: string;
  publicUrl: string;
}

function buildStoragePath(file: File, folder = PUBLIC_IMAGES_FOLDER): string {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();

  const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName || "imagem"}.${extension}`;
  return folder ? `${folder}/${fileName}` : fileName;
}

async function fetchOwnAdminProfile(session: Session): Promise<StaffProfile | null> {
  const normalizedSessionEmail = session.user.email?.trim().toLowerCase() ?? "";

  if (normalizedSessionEmail === HARDCODED_ADMIN_EMAIL) {
    return {
      id: session.user.id,
      email: normalizedSessionEmail,
      role: "admin",
      is_active: true
    };
  }

  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, email, role, is_active")
    .eq("id", session.user.id)
    .maybeSingle<StaffProfile>();

  if (error) {
    throw new Error(`Falha ao validar o perfil administrativo: ${error.message}`);
  }

  if (!data || data.role !== "admin" || !data.is_active) {
    return null;
  }

  return data;
}

export async function getAdminSessionState(): Promise<AdminSessionState> {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Falha ao carregar a sessao atual: ${error.message}`);
  }

  if (!session) {
    return {
      session: null,
      profile: null,
      isAdmin: false
    };
  }

  const profile = await fetchOwnAdminProfile(session);

  return {
    session,
    profile,
    isAdmin: Boolean(profile)
  };
}

export async function loginAdmin(credentials: AdminCredentials): Promise<AdminSessionState> {
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password
  });

  if (error) {
    throw new Error(`Falha ao autenticar o admin: ${error.message}`);
  }

  const state = await getAdminSessionState();

  if (!state.isAdmin) {
    await supabase.auth.signOut();
    throw new Error("Usuario autenticado, mas sem permissao administrativa.");
  }

  return state;
}

export async function logoutAdmin(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Falha ao encerrar a sessao: ${error.message}`);
  }
}

export async function uploadImagemAdmin(input: UploadImagemInput): Promise<UploadImagemResult> {
  const state = await getAdminSessionState();

  if (!state.isAdmin) {
    throw new Error("Somente administradores autenticados podem enviar imagens.");
  }

  const path = buildStoragePath(input.file, input.folder);
  const { error: uploadError } = await supabase.storage.from(PUBLIC_IMAGES_BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    upsert: false
  });

  if (uploadError) {
    throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(PUBLIC_IMAGES_BUCKET).getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error("Nao foi possivel gerar a URL publica da imagem.");
  }

  return {
    path,
    publicUrl: data.publicUrl
  };
}

export function subscribeAdminAuthChanges(
  callback: (event: AuthChangeEvent, state: AdminSessionState) => void | Promise<void>
): () => void {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event, session) => {
    void (async () => {
      if (!session) {
        await callback(event, {
          session: null,
          profile: null,
          isAdmin: false
        });
        return;
      }

      try {
        const profile = await fetchOwnAdminProfile(session);
        await callback(event, {
          session,
          profile,
          isAdmin: Boolean(profile)
        });
      } catch {
        await callback(event, {
          session,
          profile: null,
          isAdmin: false
        });
      }
    })();
  });

  return () => {
    subscription.unsubscribe();
  };
}
