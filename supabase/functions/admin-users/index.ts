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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// SEC-008: CORS restrito a origins do app. Configuravel via APP_ORIGINS
// (virgula-separada). Default seguro e funcional: origins do Vercel
// (production + preview) e localhost de dev.
const APP_ORIGINS = (Deno.env.get("APP_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // chamadas server-to-server sem Origin
  if (APP_ORIGINS.some((o) => o === origin)) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function withCors(origin: string | null) {
  const headers: Record<string, string> = { ...corsHeaders };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!origin) {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
}

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_RE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!PASSWORD_RE.test(password)) {
    return "Senha deve conter maiúsculas, minúsculas, número e símbolo.";
  }
  return null;
}

const USER_TYPES = ["client", "staff", "super_admin"];

// user_type -> role (modelo de roles do Radar).
const ROLE_BY_USER_TYPE = {
  client: "ROLE_VIEWER",
  staff: "ROLE_ADMIN",
  super_admin: "ROLE_SUPER_ADMIN"
};

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...withCors(origin) }
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: withCors(origin) });
  }

  // SEC-008: origem de navegador desconhecida -> bloqueia antes de processar.
  if (origin && !isAllowedOrigin(origin)) {
    return json({ error: "Origem nao permitida" }, 403, origin);
  }

  if (req.method !== "POST") {
    return json({ error: "Metodo nao permitido" }, 405, origin);
  }

  let body: { action?: string; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON invalido" }, 400, origin);
  }

  // Resolve o chamador a partir do token do app (anon + JWT do usuario).
  const authHeader = req.headers.get("Authorization");
  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader ?? "" } }
  });

  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) {
    return json({ error: "Nao autenticado" }, 401, origin);
  }

  const { data: profile } = await callerClient
    .from("profiles")
    .select("id, email, user_type, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ROLE_SUPER_ADMIN") {
    return json({ error: "Acesso negado" }, 403, origin);
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
      return json({ error: "Nome, email e senha sao obrigatorios" }, 400, origin);
    }
    if (!USER_TYPES.includes(userType)) {
      return json({ error: "user_type invalido" }, 400, origin);
    }
    const passwordIssue = validatePassword(password);
    if (passwordIssue) {
      return json({ error: passwordIssue }, 400, origin);
    }

    const role = ROLE_BY_USER_TYPE[userType];
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, user_type: userType, role }
    });

    if (error) {
      return json({ error: error.message }, 400, origin);
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
      return json({ error: profileError.message }, 500, origin);
    }

    return json({ user: { id: data.user.id, email, name } }, 201, origin);
  }

  if (action === "update") {
    const userId = String(body.user_id ?? "");
    const name = String(body.name ?? "").trim();
    const userType = String(body.user_type ?? "");
    const isUnoClient = typeof body.is_uno_client === "boolean"
      ? body.is_uno_client
      : undefined;
    const unoClientId = typeof body.uno_client_id === "string" || body.uno_client_id === null
      ? body.uno_client_id
      : undefined;

    if (!userId) {
      return json({ error: "user_id obrigatorio" }, 400, origin);
    }
    if (!USER_TYPES.includes(userType)) {
      return json({ error: "user_type invalido" }, 400, origin);
    }

    const role = ROLE_BY_USER_TYPE[userType];

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: { name, user_type: userType, role } }
    );
    if (metaError) {
      return json({ error: metaError.message }, 400, origin);
    }

    const profileUpdate: Record<string, unknown> = {
      name,
      user_type: userType,
      role
    };
    if (isUnoClient !== undefined) {
      profileUpdate.is_uno_client = isUnoClient;
    }
    if (unoClientId !== undefined) {
      profileUpdate.uno_client_id = unoClientId;
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);
    if (profileError) {
      return json({ error: profileError.message }, 500, origin);
    }

    return json({ ok: true }, 200, origin);
  }

  if (action === "reset_password") {
    const userId = String(body.user_id ?? "");
    const password = String(body.password ?? "");

    if (!userId || !password) {
      return json({ error: "user_id e senha sao obrigatorios" }, 400, origin);
    }
    const passwordIssue = validatePassword(password);
    if (passwordIssue) {
      return json({ error: passwordIssue }, 400, origin);
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password
    });
    if (error) {
      return json({ error: error.message }, 400, origin);
    }

    return json({ ok: true }, 200, origin);
  }

  if (action === "delete") {
    const userId = String(body.user_id ?? "");
    if (!userId) {
      return json({ error: "user_id obrigatorio" }, 400, origin);
    }
    if (userId === user.id) {
      return json({ error: "Voce nao pode excluir a propria conta" }, 400, origin);
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return json({ error: error.message }, 400, origin);
    }

    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Acao desconhecida" }, 400, origin);
});
