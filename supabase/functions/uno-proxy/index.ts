import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const unoAccessToken = Deno.env.get("UNO_ACCESS_TOKEN")!;
const unoApiBase = "https://unoapp.com.br/server/api/v1/outer_api";
// Prototipo: o proxy sempre aponta para o perfil de demonstracao. Na fase de
// integracao plena, o client_id passa a ser derivado do vinculo da conta.
const unoDemoClientId = Deno.env.get("UNO_DEMO_CLIENT_ID") || "192";

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
  // Apenas GET: o proxy nao escreve na API do UNO.
  if (req.method !== "GET") {
    return new Response("Metodo nao permitido", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Valida o JWT do usuario do Radar.
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
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
    return new Response("Acesso restrito a Clientes Lema", { status: 403 });
  }

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "";
  if (!ENDPOINTS[endpoint]) {
    return new Response("Endpoint invalido", { status: 400 });
  }

  // Monta a query para a API do UNO, forçando o client id do perfil demo.
  const query = new URLSearchParams();
  for (const key of ENDPOINTS[endpoint]) {
    const value = url.searchParams.get(key);
    if (value) query.set(key, value);
  }
  if (endpoint === "demonstrativoFundosCliente") {
    query.set("cliente_id", unoDemoClientId);
  } else {
    query.set("client_id", unoDemoClientId);
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
        "Content-Type": res.headers.get("Content-Type") || "application/json"
      }
    });
  } catch (err) {
    console.error("uno-proxy error", err);
    return new Response("Erro ao consultar a API do UNO", { status: 502 });
  }
});
