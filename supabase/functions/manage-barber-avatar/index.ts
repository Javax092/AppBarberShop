import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"]
};

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const HARDCODED_ADMIN_EMAIL = "ryanlmxxv@gmail.com";
const STORAGE_BUCKET = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "barbershop-assets";

type ActorContext =
  | { role: "admin"; adminUserId: string }
  | { role: "barber"; barberProfileId: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function getStoragePath(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      const marker = "/object/public/";
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex >= 0) {
        return decodeURIComponent(url.pathname.slice(markerIndex + marker.length).split("/").slice(1).join("/"));
      }
    } catch {
      return null;
    }
  }

  return raw;
}

function isManagedAvatarPath(path: string | null | undefined, profileId: string) {
  const normalizedPath = getStoragePath(path);
  return normalizedPath?.startsWith(`barbers/${profileId}/`) ?? false;
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getBarberProfile(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const { data, error } = await adminClient
    .from("barber_profiles")
    .select("id, email, barber_id, avatar_url, is_active, deleted_at")
    .eq("id", profileId)
    .maybeSingle<{
      id: string;
      email: string;
      barber_id: string | null;
      avatar_url: string | null;
      is_active: boolean;
      deleted_at: string | null;
    }>();

  if (error) {
    throw error;
  }

  return data;
}

async function getActorContext(
  request: Request,
  adminClient: ReturnType<typeof createClient>,
  body: { fallbackEmail?: string; fallbackPassword?: string }
): Promise<ActorContext> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";

  if (authHeader.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user) {
      throw Object.assign(new Error("Sessao do admin ausente, expirada ou invalida."), { status: 401 });
    }

    const normalizedEmail = normalizeEmail(user.email);
    const isHardcodedAdmin = normalizedEmail === HARDCODED_ADMIN_EMAIL;

    if (!isHardcodedAdmin) {
      const { data: profile } = await adminClient
        .from("staff_profiles")
        .select("id, role, is_active")
        .eq("id", user.id)
        .maybeSingle<{ id: string; role: "admin" | "barber"; is_active: boolean }>();

      if (!profile || profile.role !== "admin" || !profile.is_active) {
        throw Object.assign(new Error("O usuario autenticado nao tem permissao administrativa ativa."), {
          status: 403
        });
      }
    }

    return {
      role: "admin",
      adminUserId: user.id
    };
  }

  const fallbackEmail = normalizeEmail(body.fallbackEmail);
  const fallbackPassword = body.fallbackPassword?.trim() ?? "";

  if (!fallbackEmail || !fallbackPassword) {
    throw Object.assign(new Error("Autenticacao obrigatoria para atualizar a foto."), { status: 401 });
  }

  const { data, error } = await adminClient.rpc("authenticate_staff", {
    input_email: fallbackEmail,
    input_password: fallbackPassword,
    input_role: "barber"
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as { user_id?: string } | null;
  if (!row?.user_id) {
    throw Object.assign(new Error("Credenciais invalidas para barbeiro."), { status: 403 });
  }

  return {
    role: "barber",
    barberProfileId: row.user_id
  };
}

async function persistAvatar(
  adminClient: ReturnType<typeof createClient>,
  profileId: string,
  barberId: string,
  avatarPath: string | null
) {
  const updates = { avatar_url: avatarPath };

  const [profileUpdate, barberUpdate] = await Promise.all([
    adminClient.from("barber_profiles").update(updates).eq("id", profileId),
    adminClient.from("barbers").update(updates).eq("id", barberId)
  ]);

  if (profileUpdate.error) {
    throw profileUpdate.error;
  }

  if (barberUpdate.error) {
    throw barberUpdate.error;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = (await request.json()) as {
      action?: "upload" | "remove";
      targetProfileId?: string;
      imageBase64?: string;
      mimeType?: string;
      extension?: string;
      fallbackEmail?: string;
      fallbackPassword?: string;
    };

    const action = body.action ?? "upload";
    const targetProfileId = body.targetProfileId?.trim() ?? "";

    if (!targetProfileId) {
      return json({ code: "BARBER_PROFILE_REQUIRED", message: "Perfil do barbeiro nao informado." }, 400);
    }

    const actor = await getActorContext(request, adminClient, body);
    const targetProfile = await getBarberProfile(adminClient, targetProfileId);

    if (!targetProfile || !targetProfile.barber_id || targetProfile.deleted_at) {
      return json({ code: "BARBER_NOT_FOUND", message: "Barbeiro nao encontrado." }, 404);
    }

    if (actor.role !== "admin" && actor.barberProfileId !== targetProfile.id) {
      return json({ code: "BARBER_AVATAR_FORBIDDEN", message: "Voce nao tem permissao para alterar esta foto." }, 403);
    }

    if (action === "remove") {
      await persistAvatar(adminClient, targetProfile.id, targetProfile.barber_id, null);

      const currentPath = getStoragePath(targetProfile.avatar_url);
      if (isManagedAvatarPath(currentPath, targetProfile.id)) {
        await adminClient.storage.from(STORAGE_BUCKET).remove([currentPath as string]);
      }

      return json({ code: "BARBER_AVATAR_REMOVED", message: "Foto removida com sucesso.", avatarPath: null, publicUrl: null });
    }

    const mimeType = body.mimeType?.trim().toLowerCase() ?? "";
    const extension = body.extension?.trim().toLowerCase() ?? "";
    const imageBase64 = body.imageBase64?.trim() ?? "";

    if (!mimeType || !extension || !imageBase64) {
      return json({ code: "BARBER_AVATAR_INVALID_FILE", message: "Arquivo de imagem incompleto." }, 400);
    }

    if (!(mimeType in ALLOWED_TYPES) || !ALLOWED_TYPES[mimeType].includes(extension)) {
      return json({ code: "BARBER_AVATAR_UNSUPPORTED_TYPE", message: "Formato de arquivo nao permitido." }, 400);
    }

    const bytes = decodeBase64(imageBase64);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_SIZE) {
      return json({ code: "BARBER_AVATAR_TOO_LARGE", message: "A foto deve ter no maximo 3 MB." }, 400);
    }

    const avatarPath = `barbers/${targetProfile.id}/avatar-${crypto.randomUUID()}.${extension}`;
    const uploadResult = await adminClient.storage.from(STORAGE_BUCKET).upload(avatarPath, bytes, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600"
    });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    await persistAvatar(adminClient, targetProfile.id, targetProfile.barber_id, avatarPath);

    const currentPath = getStoragePath(targetProfile.avatar_url);
    if (currentPath && currentPath !== avatarPath && isManagedAvatarPath(currentPath, targetProfile.id)) {
      await adminClient.storage.from(STORAGE_BUCKET).remove([currentPath]);
    }

    const { data } = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(avatarPath);

    return json({
      code: "BARBER_AVATAR_UPDATED",
      message: "Foto atualizada com sucesso.",
      avatarPath,
      publicUrl: data.publicUrl
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 500;
    const message = error instanceof Error ? error.message : "Falha ao atualizar a foto.";
    return json({ code: "BARBER_AVATAR_ERROR", message }, status);
  }
});
