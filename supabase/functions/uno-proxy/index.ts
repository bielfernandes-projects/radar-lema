import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import {
  isSuperAdminProfile,
  canAccessLemaExclusive,
  resolveUnoClientId
} from "../_shared/access.ts";
import { decideUnoCache, isCacheable } from "../_shared/unoCache.ts";

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
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  // O front lê quando a cópia guardada foi feita (ver uno_cache).
  "Access-Control-Expose-Headers": "x-uno-fetched-at, x-uno-cache"
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

function jsonResponse(payload: unknown, origin: string | null, fetchedAt: string, cache: string) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "x-uno-fetched-at": fetchedAt,
      "x-uno-cache": cache,
      ...withCors(origin)
    }
  });
}

// Endpoints permitidos e seus parametros aceitos (além do client id).
const ENDPOINTS: Record<string, string[]> = {
  demonstrativoFundosCliente: ["consulting_id", "mes", "ano"],
  fundosCliente: ["consulting_id", "start_date", "end_date"],
  evolucaoAnualCliente: ["consulting_id", "ano"],
  clienteUNO: ["consulting_id"]
};

// Endpoints que nao sao por cliente (listam todos os clientes do
// consulting_id) — nunca recebem client_id/cliente_id e so o Super Admin
// pode chamar, pra nao vazar nome de outros RPPS pra um Cliente Lema comum.
const LIST_ENDPOINTS: Record<string, string[]> = {
  clientesUNO: ["consulting_id"]
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

  const isSuperAdmin = isSuperAdminProfile(profile);

  if (profileError) {
    return new Response("Acesso restrito a Clientes Lema", {
      status: 403,
      headers: withCors(origin)
    });
  }
  // Qualquer usuário logado consulta o Dashboard, mas só Cliente Lema e Super
  // Admin veem dados reais; os demais caem no cliente de demonstração.
  const isClient = canAccessLemaExclusive(profile);

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "";

  const isListEndpoint = Boolean(LIST_ENDPOINTS[endpoint]);
  if (!ENDPOINTS[endpoint] && !isListEndpoint) {
    return new Response("Endpoint invalido", { status: 400, headers: withCors(origin) });
  }

  if (isListEndpoint && !isSuperAdmin) {
    return new Response("Acesso restrito ao Super Admin", { status: 403, headers: withCors(origin) });
  }

  const query = new URLSearchParams();
  // Chave do cache (só demonstrativo/evolução, que gastam pageview do ComDinheiro).
  let cacheKey: string | null = null;
  let isDemoClient = false;

  if (isListEndpoint) {
    // Lista todos os clientes do consulting_id — sem client_id nenhum.
    for (const key of LIST_ENDPOINTS[endpoint]) {
      const value = url.searchParams.get(key);
      if (value) query.set(key, value);
    }
  } else {
    // Resolve qual cliente UNO real consultar. Cliente comum: sempre o
    // vinculado ao proprio perfil (profiles.uno_client_id ja guarda o
    // client_id real do UNO — ignora qualquer client_id que o front mande,
    // pra ninguem ver dado de outro RPPS trocando o parametro). Super Admin:
    // pode escolher qualquer client_id (o proprio UNO valida/rejeita se nao
    // existir).
    const resolvedClientId = resolveUnoClientId({
      isSuperAdmin,
      isClient,
      requestedClientId: url.searchParams.get("client_id"),
      ownClientId: profile?.uno_client_id,
      fallback: unoDemoClientId
    });

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
    isDemoClient = resolvedClientId === unoDemoClientId;
    if (isCacheable(endpoint)) cacheKey = `${endpoint}?${query.toString()}`;
  }

  const refresh = url.searchParams.get("refresh") === "1";
  if (cacheKey) {
    const { data: cached, error: cacheError } = await adminClient
      .from("uno_cache")
      .select("payload, fetched_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (cacheError) console.error("uno-cache read", cacheError.message);
    const decision = decideUnoCache({
      hasRow: Boolean(cached),
      fetchedAt: cached?.fetched_at,
      refresh,
      isSuperAdmin,
      isDemo: isDemoClient
    });
    if (decision === "serve" && cached) {
      return jsonResponse(cached.payload, origin, cached.fetched_at, "hit");
    }
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
    if (!res.ok) {
      // Só no log da função (Supabase > Edge Functions > Logs); o corpo segue igual pro front.
      const body = text
        .replace(/("?(?:x-access-token|authorization|cookie)"?\s*:\s*)"[^"]*"/gi, '$1"[redigido]"')
        .slice(0, 600);
      console.error("uno-proxy upstream", res.status, endpoint, query.toString(), body);
      // O erro do UNO traz a config interna do axios (url, headers, corpo da chamada ao
      // ComDinheiro): nada disso pode chegar ao navegador, só a mensagem.
      let message = "Erro ao consultar a API do UNO";
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.message === "string") message = parsed.message.slice(0, 200);
      } catch {
        // corpo não-JSON (ex.: 429 em texto): mantém a mensagem genérica
      }
      return new Response(JSON.stringify({ message }), {
        status: res.status,
        headers: { "Content-Type": "application/json", ...withCors(origin) }
      });
    }
    if (cacheKey) {
      // Guarda só respostas 200 em JSON; falha ao gravar não derruba a consulta.
      try {
        const payload = JSON.parse(text);
        const fetchedAt = new Date().toISOString();
        const { error: writeError } = await adminClient
          .from("uno_cache")
          .upsert({ cache_key: cacheKey, payload, fetched_at: fetchedAt });
        if (writeError) console.error("uno-cache write", writeError.message);
        return jsonResponse(payload, origin, fetchedAt, refresh ? "refresh" : "miss");
      } catch (err) {
        console.error("uno-cache", err);
      }
    }
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
