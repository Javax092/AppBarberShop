import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const DEFAULT_BARBER_AVAILABILITY = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  day_of_week: dayOfWeek,
  start_time: "09:00:00",
  end_time: "18:00:00",
  slot_interval_minutes: 30,
  is_active: true
}));

type StaffAction =
  | "create_barber"
  | "update_barber"
  | "deactivate_barber"
  | "reactivate_barber"
  | "delete_barber"
  | "reset_password"
  | "reset-password"
  | "upsert"
  | "toggle-active"
  | "delete";

interface BarberPayload {
  id?: string | null;
  email?: string;
  password?: string | null;
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  backendUserId?: string | null;
  barber?: {
    id?: string | null;
    name?: string;
    bio?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    specialties?: string[];
    isActive?: boolean;
  };
}

interface BarberProfileRow {
  id: string;
  barber_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  status: string;
  deleted_at: string | null;
  backend_user_id: string | null;
  barbers?: {
    id: string;
    name: string;
    bio: string;
    phone: string | null;
    avatar_url: string | null;
    specialties: string[];
    is_active: boolean;
    status: string;
    deleted_at: string | null;
  } | null;
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function buildResponse(
  success: boolean,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  httpStatus = 200,
  extra?: Record<string, unknown>
) {
  return new Response(
    JSON.stringify({
      success,
      code,
      message,
      details: details ?? null,
      ...(extra ?? {})
    }),
    {
      status: httpStatus,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
}

function ok(code: string, message: string, details?: Record<string, unknown>, httpStatus = 200, extra?: Record<string, unknown>) {
  return buildResponse(true, code, message, details, httpStatus, extra);
}

function fail(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
  return buildResponse(false, code, message, details, httpStatus);
}

async function requireAdminContext(request: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return {
      error: fail("AUTH_BEARER_REQUIRED", "Token Bearer do admin nao informado.", 401)
    };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return {
      error: fail("AUTH_INVALID_SESSION", "Sessao do admin ausente, expirada ou invalida. Entre novamente.", 401)
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("staff_profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: "admin" | "barber"; is_active: boolean }>();

  if (profileError || !profile || profile.role !== "admin" || !profile.is_active) {
    return {
      error: fail(
        "ADMIN_FORBIDDEN",
        "O usuario autenticado nao tem permissao administrativa ativa para gerenciar barbeiros.",
        403
      )
    };
  }

  return {
    adminClient,
    adminUserId: user.id
  };
}

async function getBarberProfileById(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const { data, error } = await adminClient
    .from("barber_profiles")
    .select("id, barber_id, full_name, email, phone, avatar_url, is_active, status, deleted_at, backend_user_id, barbers:barber_id (*)")
    .eq("id", profileId)
    .maybeSingle<BarberProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function getBarberProfileByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await adminClient
    .from("barber_profiles")
    .select("id, barber_id, full_name, email, phone, avatar_url, is_active, status, deleted_at, backend_user_id, barbers:barber_id (*)")
    .eq("email", normalizedEmail)
    .maybeSingle<BarberProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function countDependency(adminClient: ReturnType<typeof createClient>, table: string, barberId: string) {
  const { count, error } = await adminClient.from(table).select("id", { count: "exact", head: true }).eq("barber_id", barberId);

  if (error) {
    if (error.message?.toLowerCase().includes("barber_id")) {
      return 0;
    }

    throw error;
  }

  return count ?? 0;
}

async function countBarberDependencies(adminClient: ReturnType<typeof createClient>, barberId: string) {
  const [appointments, services, availability, scheduleBlocks] = await Promise.all([
    countDependency(adminClient, "appointments", barberId),
    countDependency(adminClient, "services", barberId),
    countDependency(adminClient, "barber_availability", barberId),
    countDependency(adminClient, "schedule_blocks", barberId)
  ]);

  return {
    appointments,
    services,
    availability,
    scheduleBlocks
  };
}

async function seedDefaultAvailabilityIfNeeded(adminClient: ReturnType<typeof createClient>, barberId: string) {
  const { count, error } = await adminClient
    .from("barber_availability")
    .select("id", { count: "exact", head: true })
    .eq("barber_id", barberId);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const rows = DEFAULT_BARBER_AVAILABILITY.map((item) => ({
    barber_id: barberId,
    day_of_week: item.day_of_week,
    start_time: item.start_time,
    end_time: item.end_time,
    slot_interval_minutes: item.slot_interval_minutes,
    is_active: item.is_active
  }));

  const { error: insertError } = await adminClient.from("barber_availability").insert(rows);
  if (insertError) {
    throw insertError;
  }
}

async function syncInternalPassword(
  adminClient: ReturnType<typeof createClient>,
  profileId: string,
  email: string,
  password: string
) {
  const { error } = await adminClient.rpc("sync_barber_auth_password", {
    input_profile_id: profileId,
    input_email: email,
    input_password: password
  });

  if (error) {
    throw error;
  }
}

async function syncInternalEmail(adminClient: ReturnType<typeof createClient>, profileId: string, email: string) {
  const { error } = await adminClient.rpc("sync_barber_auth_email", {
    input_profile_id: profileId,
    input_email: email
  });

  if (error) {
    throw error;
  }
}

function mapBarberResponse(profile: BarberProfileRow) {
  return {
    profileId: profile.id,
    barberId: profile.barber_id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    isActive: profile.is_active,
    status: profile.status,
    backendUserId: profile.backend_user_id,
    barber: profile.barbers
      ? {
          id: profile.barbers.id,
          name: profile.barbers.name,
          bio: profile.barbers.bio,
          phone: profile.barbers.phone,
          avatarUrl: profile.barbers.avatar_url,
          specialties: profile.barbers.specialties ?? [],
          isActive: profile.barbers.is_active,
          status: profile.barbers.status
        }
      : null
  };
}

async function saveBarber(
  adminClient: ReturnType<typeof createClient>,
  actorAdminUserId: string,
  action: StaffAction,
  barber: BarberPayload
) {
  const normalizedEmail = normalizeEmail(barber.email);
  const fullName = barber.fullName?.trim() ?? "";
  const password = barber.password?.trim() ?? "";
  const profileId = barber.id?.trim() ?? "";
  const requestedBarberId = barber.barber?.id?.trim() ?? null;
  const isCreate = action === "create_barber" || (action === "upsert" && !profileId);

  if (!normalizedEmail || !fullName) {
    return fail("BARBER_INVALID_INPUT", "Nome completo e email do barbeiro sao obrigatorios.", 400);
  }

  if (isCreate && !password) {
    return fail("BARBER_PASSWORD_REQUIRED", "Senha inicial obrigatoria para novo barbeiro.", 400);
  }

  const [existingById, existingByEmail] = await Promise.all([
    profileId ? getBarberProfileById(adminClient, profileId) : Promise.resolve(null),
    getBarberProfileByEmail(adminClient, normalizedEmail)
  ]);

  if (profileId && !existingById) {
    return fail("BARBER_NOT_FOUND", "Barbeiro nao encontrado para atualizacao.", 404);
  }

  if (existingByEmail && existingByEmail.id !== profileId) {
    return fail("BARBER_EMAIL_CONFLICT", "Ja existe outro barbeiro interno usando este email.", 409);
  }

  const resolvedProfileId = existingById?.id ?? crypto.randomUUID();
  const resolvedBarberId = existingById?.barber_id ?? requestedBarberId ?? crypto.randomUUID();
  const active = Boolean(barber.isActive ?? barber.barber?.isActive ?? true);
  const status = active ? "active" : "inactive";

  if (!existingById) {
    const { error: insertBarberError } = await adminClient.from("barbers").insert({
      id: resolvedBarberId,
      name: barber.barber?.name?.trim() || fullName,
      bio: barber.barber?.bio ?? "",
      phone: barber.barber?.phone?.trim() || barber.phone?.trim() || null,
      avatar_url: barber.barber?.avatarUrl ?? barber.avatarUrl ?? null,
      specialties: barber.barber?.specialties ?? [],
      is_active: active,
      status,
      created_by_admin_id: actorAdminUserId,
      backend_user_id: barber.backendUserId?.trim() || null,
      deleted_at: null
    });

    if (insertBarberError) {
      return fail("BARBER_CREATE_FAILED", insertBarberError.message, 400);
    }
  } else {
    const { error: updateBarberError } = await adminClient
      .from("barbers")
      .update({
        name: barber.barber?.name?.trim() || fullName,
        bio: barber.barber?.bio ?? "",
        phone: barber.barber?.phone?.trim() || barber.phone?.trim() || null,
        avatar_url: barber.barber?.avatarUrl ?? barber.avatarUrl ?? null,
        specialties: barber.barber?.specialties ?? [],
        is_active: active,
        status,
        backend_user_id: barber.backendUserId?.trim() || null,
        deleted_at: null
      })
      .eq("id", resolvedBarberId);

    if (updateBarberError) {
      return fail("BARBER_UPDATE_FAILED", updateBarberError.message, 400);
    }
  }

  const profilePayload: Record<string, unknown> = {
    id: resolvedProfileId,
    barber_id: resolvedBarberId,
    full_name: fullName,
    email: normalizedEmail,
    phone: barber.phone?.trim() || null,
    avatar_url: barber.avatarUrl ?? null,
    is_active: active,
    status,
    created_by_admin_id: existingById ? undefined : actorAdminUserId,
    backend_user_id: barber.backendUserId?.trim() || null,
    deleted_at: null
  };

  if (!existingById) {
    profilePayload.created_by_admin_id = actorAdminUserId;
  }

  const { error: profileError } = await adminClient.from("barber_profiles").upsert(profilePayload, { onConflict: "id" });
  if (profileError) {
    return fail("BARBER_PROFILE_SAVE_FAILED", profileError.message, 400);
  }

  try {
    await seedDefaultAvailabilityIfNeeded(adminClient, resolvedBarberId);
    await syncInternalEmail(adminClient, resolvedProfileId, normalizedEmail);

    if (password) {
      await syncInternalPassword(adminClient, resolvedProfileId, normalizedEmail, password);
    }
  } catch (error) {
    return fail(
      "BARBER_PROFILE_SAVE_FAILED",
      error instanceof Error ? error.message : "Nao foi possivel sincronizar as credenciais internas do barbeiro.",
      400
    );
  }

  const savedProfile = await getBarberProfileById(adminClient, resolvedProfileId);
  if (!savedProfile) {
    return fail("BARBER_NOT_FOUND", "Barbeiro salvo, mas nao foi possivel recarregar o cadastro.", 500);
  }

  return ok(
    isCreate ? "BARBER_CREATED" : "BARBER_UPDATED",
    isCreate ? "Barbeiro criado com sucesso." : "Barbeiro atualizado com sucesso.",
    { barber: mapBarberResponse(savedProfile) }
  );
}

async function updateBarberActiveState(
  adminClient: ReturnType<typeof createClient>,
  profileId: string,
  isActive: boolean
) {
  const existingProfile = await getBarberProfileById(adminClient, profileId);
  if (!existingProfile) {
    return fail("BARBER_NOT_FOUND", "Barbeiro nao encontrado.", 404);
  }

  const nextStatus = isActive ? "active" : "inactive";
  const nextDeletedAt = isActive ? null : existingProfile.deleted_at;

  const { error: profileError } = await adminClient
    .from("barber_profiles")
    .update({
      is_active: isActive,
      status: nextStatus,
      deleted_at: nextDeletedAt
    })
    .eq("id", profileId);

  if (profileError) {
    return fail("BARBER_STATUS_UPDATE_FAILED", profileError.message, 400);
  }

  const { error: barberError } = await adminClient
    .from("barbers")
    .update({
      is_active: isActive,
      status: nextStatus,
      deleted_at: nextDeletedAt
    })
    .eq("id", existingProfile.barber_id);

  if (barberError) {
    return fail("BARBER_STATUS_UPDATE_FAILED", barberError.message, 400);
  }

  const refreshed = await getBarberProfileById(adminClient, profileId);
  if (!refreshed) {
    return fail("BARBER_NOT_FOUND", "Barbeiro atualizado, mas nao foi possivel recarregar o cadastro.", 500);
  }

  return ok(
    isActive ? "BARBER_REACTIVATED" : "BARBER_DEACTIVATED",
    isActive ? "Barbeiro reativado com sucesso." : "Barbeiro desativado com sucesso.",
    { barber: mapBarberResponse(refreshed) }
  );
}

async function deleteBarber(adminClient: ReturnType<typeof createClient>, profileId: string) {
  const existingProfile = await getBarberProfileById(adminClient, profileId);
  if (!existingProfile) {
    return fail("BARBER_NOT_FOUND", "Barbeiro nao encontrado.", 404);
  }

  const dependencies = await countBarberDependencies(adminClient, existingProfile.barber_id);
  const hasDependencies =
    dependencies.appointments > 0 ||
    dependencies.services > 0 ||
    dependencies.availability > 0 ||
    dependencies.scheduleBlocks > 0;

  if (hasDependencies) {
    return fail(
      "BARBER_DELETE_CONFLICT",
      "Este barbeiro possui dependencias e nao pode ser excluido fisicamente. Desative o cadastro para manter o historico.",
      409,
      { dependencies }
    );
  }

  const { error: credentialDeleteError } = await adminClient
    .from("barber_auth_credentials")
    .delete()
    .eq("barber_profile_id", existingProfile.id);

  if (credentialDeleteError) {
    return fail("BARBER_DELETE_FAILED", credentialDeleteError.message, 400);
  }

  const { error: profileDeleteError } = await adminClient.from("barber_profiles").delete().eq("id", existingProfile.id);
  if (profileDeleteError) {
    return fail("BARBER_DELETE_FAILED", profileDeleteError.message, 400);
  }

  const { error: barberDeleteError } = await adminClient.from("barbers").delete().eq("id", existingProfile.barber_id);
  if (barberDeleteError) {
    return fail("BARBER_DELETE_FAILED", barberDeleteError.message, 400);
  }

  return ok("BARBER_DELETED", "Barbeiro excluido em definitivo.", {
    profileId: existingProfile.id,
    barberId: existingProfile.barber_id
  });
}

async function resetBarberPassword(
  adminClient: ReturnType<typeof createClient>,
  profileId: string,
  password: string
) {
  const existingProfile = await getBarberProfileById(adminClient, profileId);
  if (!existingProfile) {
    return fail("BARBER_NOT_FOUND", "Barbeiro nao encontrado.", 404);
  }

  if (!password.trim()) {
    return fail("BARBER_PASSWORD_REQUIRED", "Nova senha obrigatoria.", 400);
  }

  try {
    await syncInternalPassword(adminClient, existingProfile.id, existingProfile.email, password.trim());
  } catch (error) {
    return fail(
      "BARBER_PASSWORD_RESET_FAILED",
      error instanceof Error ? error.message : "Nao foi possivel atualizar a senha interna do barbeiro.",
      400
    );
  }

  return ok(
    "BARBER_PASSWORD_RESET",
    "Senha interna do barbeiro atualizada com sucesso.",
    {
      profileId: existingProfile.id,
      barberId: existingProfile.barber_id
    }
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAdminContext(request);
    if ("error" in auth) {
      return auth.error;
    }

    const payload = (await request.json()) as {
      action?: StaffAction;
      staff?: BarberPayload;
    };

    const action = payload.action;
    const barber = payload.staff ?? {};

    if (!action) {
      return fail("BARBER_ACTION_REQUIRED", "Acao obrigatoria.", 400);
    }

    if (action === "create_barber" || action === "update_barber" || action === "upsert") {
      const normalizedAction = action === "create_barber" || action === "update_barber" ? action : barber.id ? "update_barber" : "create_barber";
      return await saveBarber(auth.adminClient, auth.adminUserId, normalizedAction, barber);
    }

    if (action === "deactivate_barber" || (action === "toggle-active" && barber.isActive === false)) {
      if (!barber.id) {
        return fail("BARBER_ID_REQUIRED", "Perfil do barbeiro obrigatorio.", 400);
      }

      return await updateBarberActiveState(auth.adminClient, barber.id, false);
    }

    if (action === "reactivate_barber" || (action === "toggle-active" && barber.isActive === true)) {
      if (!barber.id) {
        return fail("BARBER_ID_REQUIRED", "Perfil do barbeiro obrigatorio.", 400);
      }

      return await updateBarberActiveState(auth.adminClient, barber.id, true);
    }

    if (action === "delete_barber" || action === "delete") {
      if (!barber.id) {
        return fail("BARBER_ID_REQUIRED", "Perfil do barbeiro obrigatorio.", 400);
      }

      return await deleteBarber(auth.adminClient, barber.id);
    }

    if (action === "reset_password" || action === "reset-password") {
      if (!barber.id) {
        return fail("BARBER_ID_REQUIRED", "Perfil do barbeiro obrigatorio.", 400);
      }

      return await resetBarberPassword(auth.adminClient, barber.id, barber.password ?? "");
    }

    return fail("BARBER_ACTION_INVALID", "Acao invalida.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao gerenciar barbeiros.";
    return fail("BARBER_INTERNAL_ERROR", message, 500);
  }
});
