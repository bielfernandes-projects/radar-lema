import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const unoAccessToken = Deno.env.get("UNO_ACCESS_TOKEN")!;
const unoApiBase = "https://unoapp.com.br/server/api/v1";
// Prototipo: o proxy sempre aponta para o perfil de demonstracao. Na fase de
// integracao plena, o client_id passa a ser derivado do vinculo da conta.
const unoDemoClientId = Deno.env.get("UNO_DEMO_CLIENT_ID") || "192";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

// SEC-008: CORS restrito a origins do app
const APP_ORIGINS = (Deno.env.get("APP_ORIGINS") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
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

// Outer API endpoints (GET, query params)
const OUTER_ENDPOINTS: Record<string, string[]> = {
  demonstrativoFundosCliente: ["consulting_id", "mes", "ano"],
  fundosCliente: ["consulting_id", "start_date", "end_date"],
  movimentacoesCliente: ["consulting_id", "start_date", "end_date"],
  titulosAnalise: ["consulting_id", "start_date", "end_date"],
  enquadramentosCliente: ["consulting_id", "start_date", "end_date"],
  metaCliente: ["consulting_id", "start_date", "end_date"],
  metaClientePorAno: ["ano"],
  disponibilidadesCliente: ["consulting_id", "start_date", "end_date"]
};

// Internal endpoints (POST with JSON body, or GET with query params)
// Each entry: { path, method, bodyKeys }
const INTERNAL_ENDPOINTS: Record<string, { path: string; method: string; bodyKeys: string[] }> = {
  getClientDiaryPlsByRange: {
    path: "client/getClientDiaryPlsByRange",
    method: "POST",
    bodyKeys: ["start_date", "end_date"]
  },
  getClientPortfolioRentsByLimit: {
    path: "client/getClientPortfolioRentsByLimit",
    method: "POST",
    bodyKeys: ["limit", "end_date"]
  },
  getClientLastQuota: {
    path: "client/getClientLastQuota",
    method: "POST",
    bodyKeys: ["month", "year"]
  },
  inflationRates: {
    path: "inflation_rates/getClientInflationRates",
    method: "GET",
    bodyKeys: []
  }
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: withCors(origin) });
  }

  if (req.method !== "GET" && req.method !== "POST") {
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

  // Acesso restrito a Clientes Lema.
  const { data: profile, error: profileError } = await createClient(
    supabaseUrl,
    serviceRole,
    { auth: { persistSession: false } }
  )
    .from("profiles")
    .select("is_uno_client")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_uno_client) {
    return new Response("Acesso restrito a Clientes Lema", {
      status: 403,
      headers: withCors(origin)
    });
  }

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "";

  // Determine if this is an outer or internal endpoint
  const isOuter = endpoint in OUTER_ENDPOINTS;
  const internalDef = INTERNAL_ENDPOINTS[endpoint];

  if (!isOuter && !internalDef) {
    return new Response("Endpoint invalido", { status: 400, headers: withCors(origin) });
  }

  try {
    let targetUrl: string;
    let fetchOptions: RequestInit;

    if (isOuter) {
      // Outer API: GET with query params
      const query = new URLSearchParams();
      for (const key of OUTER_ENDPOINTS[endpoint]) {
        const value = url.searchParams.get(key);
        if (value) query.set(key, value);
      }
      if (endpoint === "demonstrativoFundosCliente") {
        query.set("cliente_id", unoDemoClientId);
      } else {
        query.set("client_id", unoDemoClientId);
      }
      targetUrl = `${unoApiBase}/outer_api/${endpoint}?${query.toString()}`;
      fetchOptions = {
        method: "GET",
        headers: {
          "x-access-token": unoAccessToken,
          "Content-Type": "application/json"
        }
      };
    } else {
      // Internal endpoint
      targetUrl = `${unoApiBase}/${internalDef.path}`;

      if (internalDef.method === "POST") {
        let body: Record<string, unknown> = {};
        if (req.method === "POST") {
          try { body = await req.json(); } catch { /* ignore */ }
        }
        const payload: Record<string, unknown> = { client_id: Number(unoDemoClientId) };
        for (const key of internalDef.bodyKeys) {
          if (body[key] !== undefined) payload[key] = body[key];
        }
        // For GET fallback params from query string
        for (const key of internalDef.bodyKeys) {
          const qv = url.searchParams.get(key);
          if (qv && payload[key] === undefined) payload[key] = qv;
        }
        fetchOptions = {
          method: "POST",
          headers: {
            "x-access-token": unoAccessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        };
      } else {
        // GET internal endpoint
        const query = new URLSearchParams();
        query.set("client_id", unoDemoClientId);
        for (const key of internalDef.bodyKeys) {
          const value = url.searchParams.get(key);
          if (value) query.set(key, value);
        }
        targetUrl += `?${query.toString()}`;
        fetchOptions = {
          method: "GET",
          headers: {
            "x-access-token": unoAccessToken,
            "Content-Type": "application/json"
          }
        };
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
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
