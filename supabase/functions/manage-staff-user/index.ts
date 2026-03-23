import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const HARDCODED_ADMIN_EMAIL = "ryanlmxxv@gmail.com";

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

type StaffAction = "upsert" | "toggle-active" | "reset-password" | "delete";

interface StaffPayload {
  id?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: "admin" | "barber";
  barberId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  barber?: {
    id?: string;
    name?: string;
    bio?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    specialties?: string[];
    isActive?: boolean;
  };
}

const DEFAULT_BARBER_AVAILABILITY = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  day_of_week: dayOfWeek,
  start_time: "09:00:00",
  end_time: "18:00:00",
  slot_interval_minutes: 30,
  is_active: true
}));

interface StaffProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "barber";
  barber_id: string | null;
  is_active: boolean;
  avatar_url?: string | null;
}

const STORAGE_BUCKET = Deno.env.get("SUPABASE_STORAGE_BUCKET") ?? "barbershop-assets";

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

async function getStaffProfileById(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient
    .from("staff_profiles")
    .select("id, email, full_name, role, barber_id, is_active, avatar_url")
    .eq("id", userId)
    .maybeSingle<StaffProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function getStaffProfileByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await adminClient
    .from("staff_profiles")
    .select("id, email, full_name, role, barber_id, is_active, avatar_url")
    .eq("email", normalizeEmail(email))
    .maybeSingle<StaffProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function updateAuthUser(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  normalizedEmail: string,
  fullName: string,
  password?: string
) {
  const authUpdate: Record<string, unknown> = {
    email: normalizedEmail,
    user_metadata: {
      full_name: fullName
    }
  };

  if (password) {
    authUpdate.password = password;
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, authUpdate);
  if (error) {
    throw error;
  }
}

async function cleanupCreatedResources(
  adminClient: ReturnType<typeof createClient>,
  createdBarberId: string | null,
  createdUserId: string | null
) {
  if (createdBarberId) {
    await adminClient.from("barbers").delete().eq("id", createdBarberId);
  }

  if (createdUserId) {
    await adminClient.auth.admin.deleteUser(createdUserId);
  }
}

async function syncStaffAppCredentialEmail(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  email: string
) {
  const { error } = await adminClient.rpc("sync_staff_app_credential_email", {
    input_user_id: userId,
    input_email: email
  });

  if (error) {
    throw error;
  }
}

async function syncStaffAppPassword(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  password: string
) {
  const { error } = await adminClient.rpc("sync_staff_app_password", {
    input_user_id: userId,
    input_email: email,
    input_password: password
  });

  if (error) {
    throw error;
  }
}

async function deleteManagedBarberAvatar(
  adminClient: ReturnType<typeof createClient>,
  profileId: string,
  avatarUrl: string | null | undefined
) {
  const path = getStoragePath(avatarUrl);
  if (!path || !isManagedAvatarPath(path, profileId)) {
    return;
  }

  await adminClient.storage.from(STORAGE_BUCKET).remove([path]);
}

async function saveBarberStaffProfile(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  staff: StaffPayload
) {
  const { data, error } = await adminClient.rpc("save_barber_staff_profile", {
    input_user_id: userId,
    input_email: normalizeEmail(staff.email),
    input_full_name: staff.fullName ?? staff.barber?.name ?? "",
    input_phone: staff.phone ?? null,
    input_avatar_url: staff.avatarUrl ?? null,
    input_is_active: Boolean(staff.isActive ?? true),
    input_barber_id: staff.barber?.id ?? staff.barberId ?? null,
    input_barber_name: staff.barber?.name ?? staff.fullName ?? "",
    input_barber_bio: staff.barber?.bio ?? "",
    input_barber_phone: staff.barber?.phone ?? staff.phone ?? null,
    input_barber_avatar_url: staff.barber?.avatarUrl ?? staff.avatarUrl ?? null,
    input_barber_specialties: staff.barber?.specialties ?? [],
    input_barber_is_active: Boolean(staff.barber?.isActive ?? staff.isActive ?? true),
    input_default_availability: DEFAULT_BARBER_AVAILABILITY
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const barberId = row?.barber_id ?? row?.barberId ?? null;

  if (!barberId) {
    throw new Error("Nao foi possivel salvar o vinculo do barbeiro.");
  }

  return {
    profileId: row?.profile_id ?? row?.profileId ?? userId,
    barberId
  };
}

async function ensureProfileOwnership(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  normalizedEmail: string
) {
  const [profileById, profileByEmail] = await Promise.all([
    getStaffProfileById(adminClient, userId),
    getStaffProfileByEmail(adminClient, normalizedEmail)
  ]);

  if (profileById && profileById.email !== normalizedEmail) {
    return {
      error:
        "Ja existe um staff_profiles para este usuario com outro email. Atualize o cadastro existente antes de trocar o email."
    };
  }

  if (profileByEmail && profileByEmail.id !== userId) {
    return {
      error:
        "Ja existe outro staff_profiles usando este email. Sincronize ou remova o perfil antigo antes de reutilizar o email."
    };
  }

  return { profileById, profileByEmail };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = request.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user }
    } = await userClient.auth.getUser();

    if (!user) {
      return json({ error: "Nao autenticado." }, 401);
    }

    const { data: profile, error: profileError } = await adminClient
      .from("staff_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    const isHardcodedAdmin = normalizeEmail(user.email) === HARDCODED_ADMIN_EMAIL;

    if ((profileError || profile?.role !== "admin" || !profile?.is_active) && !isHardcodedAdmin) {
      return json(
        {
          error:
            "A conta autenticada nao pode gerenciar a equipe. Use um usuario com registro ativo em staff_profiles, role = admin e faca login novamente se a sessao estiver desatualizada."
        },
        403
      );
    }

    const payload = (await request.json()) as { action?: StaffAction; staff?: StaffPayload };
    const action = payload.action;
    const staff = payload.staff ?? {};

    if (!action) {
      return json({ error: "Acao obrigatoria." }, 400);
    }

    if (action === "reset-password") {
      if (!staff.id || !staff.password) {
        return json({ error: "Usuario e nova senha sao obrigatorios." }, 400);
      }

      const existingProfile = await getStaffProfileById(adminClient, staff.id);
      if (!existingProfile) {
        return json({ error: "Perfil nao encontrado." }, 404);
      }

      const { error } = await adminClient.auth.admin.updateUserById(staff.id, {
        password: staff.password
      });

      if (error) {
        return json({ error: error.message }, 400);
      }

      await syncStaffAppPassword(adminClient, staff.id, existingProfile.email, staff.password);

      return json({ success: true });
    }

    if (action === "toggle-active") {
      if (!staff.id) {
        return json({ error: "Usuario obrigatorio." }, 400);
      }

      const activeFlag = Boolean(staff.isActive);
      const { data: existingProfile, error: existingProfileError } = await adminClient
        .from("staff_profiles")
        .select("id, barber_id, role")
        .eq("id", staff.id)
        .single();

      if (existingProfileError || !existingProfile) {
        return json({ error: "Perfil nao encontrado." }, 404);
      }

      const { error: profileUpdateError } = await adminClient
        .from("staff_profiles")
        .update({ is_active: activeFlag })
        .eq("id", staff.id);

      if (profileUpdateError) {
        return json({ error: profileUpdateError.message }, 400);
      }

      if (existingProfile.role === "barber" && existingProfile.barber_id) {
        const { error: barberUpdateError } = await adminClient
          .from("barbers")
          .update({ is_active: activeFlag })
          .eq("id", existingProfile.barber_id);

        if (barberUpdateError) {
          return json({ error: barberUpdateError.message }, 400);
        }
      }

      return json({ success: true });
    }

    if (action === "delete") {
      if (!staff.id) {
        return json({ error: "Usuario obrigatorio." }, 400);
      }

      if (staff.id === user.id) {
        return json({ error: "Voce nao pode excluir o proprio usuario administrador." }, 400);
      }

      const existingProfile = await getStaffProfileById(adminClient, staff.id);
      if (!existingProfile) {
        return json({ error: "Perfil nao encontrado." }, 404);
      }

      const avatarCleanup = deleteManagedBarberAvatar(adminClient, existingProfile.id, existingProfile.avatar_url ?? null);

      if (existingProfile.role === "barber" && existingProfile.barber_id) {
        const { error: barberDeleteError } = await adminClient.from("barbers").delete().eq("id", existingProfile.barber_id);

        if (barberDeleteError) {
          return json({ error: barberDeleteError.message }, 400);
        }
      } else {
        const { error: profileDeleteError } = await adminClient.from("staff_profiles").delete().eq("id", existingProfile.id);

        if (profileDeleteError) {
          return json({ error: profileDeleteError.message }, 400);
        }
      }

      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(existingProfile.id);
      if (authDeleteError) {
        return json({ error: authDeleteError.message }, 400);
      }

      await avatarCleanup;

      return json({ success: true });
    }

    if (action !== "upsert") {
      return json({ error: "Acao invalida." }, 400);
    }

    if (!staff.email || !staff.fullName || !staff.role) {
      return json({ error: "Email, nome e role sao obrigatorios." }, 400);
    }

    const normalizedEmail = normalizeEmail(staff.email);
    const existingProfileByEmail = await getStaffProfileByEmail(adminClient, normalizedEmail);

    let userId = staff.id ?? existingProfileByEmail?.id;
    let createdUserId: string | null = null;
    let createdBarberId: string | null = null;

    if (staff.id && existingProfileByEmail && existingProfileByEmail.id !== staff.id) {
      return json(
        {
          error:
            "Ja existe outro staff_profiles usando este email. Sincronize ou remova o perfil antigo antes de reutilizar o email."
        },
        400
      );
    }

    if (userId) {
      try {
        await updateAuthUser(adminClient, userId, normalizedEmail, staff.fullName, staff.password);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Falha ao atualizar usuario." }, 400);
      }
    } else {
      if (!staff.password) {
        return json({ error: "Senha inicial obrigatoria para novo barbeiro." }, 400);
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: staff.password,
        email_confirm: true,
        user_metadata: {
          full_name: staff.fullName
        }
      });

      if (error || !data.user) {
        return json({ error: error?.message ?? "Falha ao criar usuario." }, 400);
      }

      userId = data.user.id;
      createdUserId = data.user.id;
    }

    if (!userId) {
      return json({ error: "Nao foi possivel resolver o usuario autenticado para este perfil." }, 400);
    }

    const ownership = await ensureProfileOwnership(adminClient, userId, normalizedEmail);
    if ("error" in ownership) {
      if (createdUserId) {
        await cleanupCreatedResources(adminClient, createdBarberId, createdUserId);
      }
      return json({ error: ownership.error }, 400);
    }

    const existingProfile = ownership.profileById ?? ownership.profileByEmail ?? null;

    let barberId: string | null = null;

    try {
      if (staff.role === "barber") {
        const targetBarberId = staff.barber?.id ?? staff.barberId ?? existingProfile?.barber_id ?? null;

        if (!targetBarberId && !staff.barber) {
          throw new Error("Perfis com role barber exigem um barbeiro vinculado ou dados para criar um novo.");
        }

        const savedBarber = await saveBarberStaffProfile(adminClient, userId, {
          ...staff,
          barberId: targetBarberId,
          barber: staff.barber
            ? {
                ...staff.barber,
                id: targetBarberId ?? staff.barber.id
              }
            : {
                id: targetBarberId ?? undefined,
                name: staff.fullName,
                bio: "",
                phone: staff.phone ?? null,
                avatarUrl: staff.avatarUrl ?? null,
                specialties: [],
                isActive: Boolean(staff.isActive ?? true)
              }
        });

        barberId = savedBarber.barberId;
        if (!targetBarberId) {
          createdBarberId = savedBarber.barberId;
        }
      } else {
        barberId = null;

        const profilePayload = {
          id: userId,
          email: normalizedEmail,
          full_name: staff.fullName,
          role: staff.role,
          phone: staff.phone ?? null,
          avatar_url: staff.avatarUrl ?? null,
          barber_id: null,
          is_active: Boolean(staff.isActive ?? true)
        };

        const { error: saveError } = await adminClient.from("staff_profiles").upsert(profilePayload, { onConflict: "id" });

        if (saveError) {
          throw new Error(saveError.message);
        }
      }

      await syncStaffAppCredentialEmail(adminClient, userId, normalizedEmail);

      if (staff.password) {
        await syncStaffAppPassword(adminClient, userId, normalizedEmail, staff.password);
      }

      return json({
        success: true,
        staff: {
          id: userId
        },
        barberId
      });
    } catch (error) {
      await cleanupCreatedResources(adminClient, createdBarberId, createdUserId);
      return json({ error: error instanceof Error ? error.message : "Erro interno." }, 400);
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno." }, 500);
  }
});
