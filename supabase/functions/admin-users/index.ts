// Edge Function admin-users: gestao de usuarios pelo super admin.
// Usa service role para criar/editar/excluir usuarios e redefinir senhas,
// mas valida o chamador (JWT do app) como ROLE_SUPER_ADMIN antes de agir.
//
// Acoes (POST JSON { action, ... }):
//   create         { name, email, password, user_type }
//   update         { user_id, name, user_type }
//   delete         { user_id }
//   reset_password { user_id, password }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const USER_TYPES = ["client", "staff", "super_admin"];

// user_type -> role (modelo de roles do Radar).
const ROLE_BY_USER_TYPE = {
  client: "ROLE_VIEWER",
  staff: "ROLE_ADMIN",
  super_admin: "ROLE_SUPER_ADMIN"
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Metodo nao permitido" }, 405);
  }

  let body: { action?: string; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON invalido" }, 400);
  }

  // Resolve o chamador a partir do token do app (anon + JWT do usuario).
  const authHeader = req.headers.get("Authorization");
  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader ?? "" } }
  });

  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) {
    return json({ error: "Nao autenticado" }, 401);
  }

  const { data: profile } = await callerClient
    .from("profiles")
    .select("id, email, user_type, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ROLE_SUPER_ADMIN") {
    return json({ error: "Acesso negado" }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false }
  });

  const action = body.action;

  if (action === "create") {
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const userType = String(body.user_type ?? "client");

    if (!name || !email || !password) {
      return json({ error: "Nome, email e senha sao obrigatorios" }, 400);
    }
    if (!USER_TYPES.includes(userType)) {
      return json({ error: "user_type invalido" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Senha deve ter ao menos 6 caracteres" }, 400);
    }

    const role = ROLE_BY_USER_TYPE[userType];
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, user_type: userType, role }
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    // Garante o profile (o trigger deve ter criado; reforca por seguranca).
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: data.user.id,
      email,
      name,
      user_type: userType,
      role
    });
    if (profileError) {
      return json({ error: profileError.message }, 500);
    }

    return json({ user: { id: data.user.id, email, name } }, 201);
  }

  if (action === "update") {
    const userId = String(body.user_id ?? "");
    const name = String(body.name ?? "").trim();
    const userType = String(body.user_type ?? "");

    if (!userId) {
      return json({ error: "user_id obrigatorio" }, 400);
    }
    if (!USER_TYPES.includes(userType)) {
      return json({ error: "user_type invalido" }, 400);
    }

    const role = ROLE_BY_USER_TYPE[userType];

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: { name, user_type: userType, role } }
    );
    if (metaError) {
      return json({ error: metaError.message }, 400);
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ name, user_type: userType, role })
      .eq("id", userId);
    if (profileError) {
      return json({ error: profileError.message }, 500);
    }

    return json({ ok: true });
  }

  if (action === "reset_password") {
    const userId = String(body.user_id ?? "");
    const password = String(body.password ?? "");

    if (!userId || !password) {
      return json({ error: "user_id e senha sao obrigatorios" }, 400);
    }
    if (password.length < 6) {
      return json({ error: "Senha deve ter ao menos 6 caracteres" }, 400);
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password
    });
    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ ok: true });
  }

  if (action === "delete") {
    const userId = String(body.user_id ?? "");
    if (!userId) {
      return json({ error: "user_id obrigatorio" }, 400);
    }
    if (userId === user.id) {
      return json({ error: "Voce nao pode excluir a propria conta" }, 400);
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ ok: true });
  }

  return json({ error: "Acao desconhecida" }, 400);
});
