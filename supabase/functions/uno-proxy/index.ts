import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const unoAccessToken = Deno.env.get("UNO_ACCESS_TOKEN")!;
const unoApiBase = "https://unoapp.com.br/server/api/v1/outer_api";
// Fallback apenas se o perfil nao tiver nenhum cliente vinculado ainda.
const unoDemoClientId = Deno.env.get("UNO_DEMO_CLIENT_ID") || "192";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
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

// Endpoints permitidos e seus parametros aceitos (além do client id).
const ENDPOINTS: Record<string, string[]> = {
  demonstrativoFundosCliente: ["consulting_id", "mes", "ano"],
  fundosCliente: ["consulting_id", "start_date", "end_date"],
  movimentacoesCliente: ["consulting_id", "start_date", "end_date"],
  titulosAnalise: ["consulting_id", "start_date", "end_date"],
  enquadramentosCliente: ["consulting_id", "start_date", "end_date"],
  metaCliente: ["consulting_id", "start_date", "end_date"],
  metaClientePorAno: ["ano"],
  disponibilidadesCliente: ["consulting_id", "start_date", "end_date"]
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Preflight do CORS: autoriza o GET cross-origin com os headers do app.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: withCors(origin) });
  }

  // Apenas GET: o proxy nao escreve na API do UNO.
  if (req.method !== "GET") {
    return new Response("Metodo nao permitido", {
      status: 405,
      headers: withCors(origin)
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: withCors(origin) });
  }

  // Valida o JWT do usuario do Radar.
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response("Unauthorized", { status: 401, headers: withCors(origin) });
  }

  // Acesso restrito a Clientes Lema — Super Admin sempre passa, mesmo sem a
  // flag de cliente (mesma regra de canAccessLemaExclusive no frontend).
  const adminClient = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false }
  });

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_uno_client, user_type, role, uno_client_id")
    .eq("id", user.id)
    .single();

  const isSuperAdmin =
    profile?.user_type === "super_admin" || profile?.role === "ROLE_SUPER_ADMIN";

  if (profileError || !(profile?.is_uno_client || isSuperAdmin)) {
    return new Response("Acesso restrito a Clientes Lema", {
      status: 403,
      headers: withCors(origin)
    });
  }

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "";
  if (!ENDPOINTS[endpoint]) {
    return new Response("Endpoint invalido", { status: 400, headers: withCors(origin) });
  }

  // Resolve qual cliente UNO real consultar. Cliente comum: sempre o
  // vinculado ao proprio perfil (ignora qualquer client_id que o front
  // mande, pra ninguem ver dado de outro RPPS trocando o parametro). Super
  // Admin: pode escolher qualquer cliente cadastrado em uno_clients — o
  // valor enviado e validado contra a tabela antes de ser usado.
  let resolvedClientId: string | null = null;

  if (!isSuperAdmin) {
    if (profile?.uno_client_id) {
      const { data: linkedClient } = await adminClient
        .from("uno_clients")
        .select("uno_client_id")
        .eq("id", profile.uno_client_id)
        .single();
      resolvedClientId = linkedClient?.uno_client_id ?? null;
    }
  } else {
    const requested = url.searchParams.get("client_id");
    if (requested) {
      const { data: match } = await adminClient
        .from("uno_clients")
        .select("uno_client_id")
        .eq("uno_client_id", requested)
        .single();
      resolvedClientId = match?.uno_client_id ?? null;
    }
  }

  if (!resolvedClientId) {
    resolvedClientId = unoDemoClientId;
  }

  // Monta a query para a API do UNO com o client id resolvido.
  const query = new URLSearchParams();
  for (const key of ENDPOINTS[endpoint]) {
    const value = url.searchParams.get(key);
    if (value) query.set(key, value);
  }
  // Todos os endpoints usam client_id. demonstrativoFundosCliente usa cliente_id.
  if (endpoint === "demonstrativoFundosCliente") {
    query.set("cliente_id", resolvedClientId);
  } else {
    query.set("client_id", resolvedClientId);
  }

  const targetUrl = `${unoApiBase}/${endpoint}?${query.toString()}`;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "x-access-token": unoAccessToken,
        "Content-Type": "application/json"
      }
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
        ...withCors(origin)
      }
    });
  } catch (err) {
    console.error("uno-proxy error", err);
    return new Response("Erro ao consultar a API do UNO", {
      status: 502,
      headers: withCors(origin)
    });
  }
});
