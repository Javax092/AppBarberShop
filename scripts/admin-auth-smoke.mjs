import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de rodar o smoke test.");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function attempt(email, password, expectedRole) {
  const signIn = await supabase.auth.signInWithPassword({ email, password });

  if (signIn.error || !signIn.data.session) {
    return {
      email,
      stage: "sign_in",
      ok: false,
      message: signIn.error?.message ?? "Sessao ausente"
    };
  }

  const session = signIn.data.session;
  const { data: profile, error } = await supabase
    .from("staff_profiles")
    .select("id,email,role,is_active,full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  await supabase.auth.signOut();

  if (error) {
    return { email, stage: "profile", ok: false, message: error.message };
  }

  if (!profile) {
    return {
      email,
      stage: "profile",
      ok: false,
      message: "Usuario autenticado, mas sem cadastro admin ativo em staff_profiles."
    };
  }

  if (profile.role !== expectedRole) {
    return {
      email,
      stage: "role",
      ok: false,
      message: "Perfil sem permissao para esta area.",
      profile
    };
  }

  if (!profile.is_active) {
    return {
      email,
      stage: "active",
      ok: false,
      message: "Usuario inativo.",
      profile
    };
  }

  return {
    email,
    stage: "done",
    ok: true,
    message: "OK",
    profile
  };
}

const cases = JSON.parse(process.env.ADMIN_TEST_CASES || "[]");
const results = [];

for (const item of cases) {
  results.push(await attempt(item.email, item.password, "admin"));
}

console.log(JSON.stringify(results, null, 2));
