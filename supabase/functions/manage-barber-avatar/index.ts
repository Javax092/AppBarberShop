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

async function getStaffProfile(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const { data, error } = await adminClient
    .from("staff_profiles")
    .select("id, email, role, barber_id, avatar_url, is_active")
    .eq("id", profileId)
    .maybeSingle<{
      id: string;
      email: string;
      role: "admin" | "barber";
      barber_id: string | null;
      avatar_url: string | null;
      is_active: boolean;
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
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";

  if (authHeader) {
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    const {
      data: { user }
    } = await userClient.auth.getUser();

    if (user) {
      const profile = await getStaffProfile(adminClient, user.id);
      const normalizedEmail = normalizeEmail(user.email);
      const isAdmin = Boolean(
        (profile?.role === "admin" && profile?.is_active) || normalizedEmail === HARDCODED_ADMIN_EMAIL
      );

      return {
        userId: user.id,
        role: isAdmin ? "admin" : profile?.role ?? null
      };
    }
  }

  const fallbackEmail = normalizeEmail(body.fallbackEmail);
  const fallbackPassword = body.fallbackPassword?.trim() ?? "";

  if (!fallbackEmail || !fallbackPassword) {
    throw new Error("Autenticacao obrigatoria para atualizar a foto.");
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
    throw new Error("Credenciais invalidas para barbeiro.");
  }

  return {
    userId: row.user_id,
    role: "barber" as const
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
    adminClient.from("staff_profiles").update(updates).eq("id", profileId),
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
      return json({ error: "Perfil do barbeiro nao informado." }, 400);
    }

    const actor = await getActorContext(request, adminClient, body);
    const targetProfile = await getStaffProfile(adminClient, targetProfileId);

    if (!targetProfile || targetProfile.role !== "barber" || !targetProfile.barber_id) {
      return json({ error: "Barbeiro nao encontrado." }, 404);
    }

    if (actor.role !== "admin" && actor.userId !== targetProfile.id) {
      return json({ error: "Voce nao tem permissao para alterar esta foto." }, 403);
    }

    if (action === "remove") {
      await persistAvatar(adminClient, targetProfile.id, targetProfile.barber_id, null);

      const currentPath = getStoragePath(targetProfile.avatar_url);
      if (isManagedAvatarPath(currentPath, targetProfile.id)) {
        await adminClient.storage.from(STORAGE_BUCKET).remove([currentPath as string]);
      }

      return json({ avatarPath: null, publicUrl: null });
    }

    const mimeType = body.mimeType?.trim().toLowerCase() ?? "";
    const extension = body.extension?.trim().toLowerCase() ?? "";
    const imageBase64 = body.imageBase64?.trim() ?? "";

    if (!mimeType || !extension || !imageBase64) {
      return json({ error: "Arquivo de imagem incompleto." }, 400);
    }

    if (!(mimeType in ALLOWED_TYPES) || !ALLOWED_TYPES[mimeType].includes(extension)) {
      return json({ error: "Formato de arquivo nao permitido." }, 400);
    }

    const bytes = decodeBase64(imageBase64);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_SIZE) {
      return json({ error: "A foto deve ter no maximo 3 MB." }, 400);
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
      avatarPath,
      publicUrl: data.publicUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar a foto.";
    return json({ error: message }, 500);
  }
});
