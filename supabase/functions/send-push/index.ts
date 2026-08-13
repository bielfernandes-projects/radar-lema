import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  eventId?: string;
}

const MAX_RECIPIENTS = 5000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sendOne(row: SubscriptionRow, payload: PushPayload): Promise<string> {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload)
    );
    return "sent";
  } catch (err) {
    // 404/410 = assinatura expirada; nao e erro - apenas desconsidere.
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      return "gone";
    }
    throw err;
  }
}

// Resolve os usuarios-alvo de um audience do hub.
//   - 'all': todos os usuarios com push ativo (notification_settings.push_enabled)
//   - 'uno_clients': apenas os que tambem sao Clientes Lema (is_uno_client)
async function resolveAudience(audience: "all" | "uno_clients"): Promise<string[]> {
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("user_id")
    .eq("push_enabled", true);

  const enabledIds = new Set((settings || []).map((s) => s.user_id as string));

  if (audience === "all") {
    return Array.from(enabledIds);
  }

  const { data: unoClients } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_uno_client", true);

  return (unoClients || [])
    .map((p) => p.id as string)
    .filter((id) => enabledIds.has(id));
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    userIds?: string[];
    eventCategoryIds?: string[];
    audience?: "all" | "uno_clients";
    payload: PushPayload;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("JSON invalido", { status: 400 });
  }

  const { eventCategoryIds, audience, payload } = body;

  if (!payload?.title) {
    return new Response("payload.title e obrigatorio", { status: 400 });
  }

  // SEC-004: exige um alvo explicito. Sem userIds, categories nem audience,
  // recusa em vez de fazer broadcast global para todos os inscritos do app.
  const hasUserIds = Array.isArray(body.userIds) && body.userIds.length > 0;
  const hasCategoryIds =
    Array.isArray(eventCategoryIds) && eventCategoryIds.length > 0;
  const hasAudience = audience === "all" || audience === "uno_clients";

  if (!hasUserIds && !hasCategoryIds && !hasAudience) {
    return new Response(
      "Informe userIds, eventCategoryIds ou audience para evitar broadcast global",
      { status: 400 }
    );
  }

  if (hasUserIds && body.userIds!.some((id) => !UUID_RE.test(id))) {
    return new Response("userIds invalido (UUID esperado)", { status: 400 });
  }

  // Define a lista de usuarios-alvo.
  let targetUserIds: string[] | null = null;

  if (hasUserIds) {
    targetUserIds = Array.from(new Set(body.userIds!));
  } else if (hasCategoryIds) {
    const { data: matches } = await supabase
      .from("notification_settings")
      .select("user_id, categories_enabled")
      .eq("push_enabled", true);

    const targeted = new Set<string>();
    (matches || []).forEach((s) => {
      const hasAny = (s.categories_enabled || []).includes("*");
      const hasCategory = (s.categories_enabled || []).some((c: string) =>
        eventCategoryIds!.includes(c)
      );
      if (hasAny || hasCategory) targeted.add(s.user_id);
    });
    if (targeted.size === 0) {
      return Response.json({ sent: 0, gone: 0, failed: 0, total: 0 });
    }
    targetUserIds = Array.from(targeted);
  } else if (hasAudience) {
    const resolved = await resolveAudience(audience!);
    if (resolved.length === 0) {
      return Response.json({ sent: 0, gone: 0, failed: 0, total: 0 });
    }
    targetUserIds = resolved;
  }

  if (targetUserIds && targetUserIds.length > MAX_RECIPIENTS) {
    return new Response(
      `Muitos destinatarios (max ${MAX_RECIPIENTS})`,
      { status: 400 }
    );
  }

  // Busca as assinaturas.
  let query = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (targetUserIds) {
    query = query.in("user_id", targetUserIds);
  }

  const { data: subscriptions, error } = await query;
  if (error) throw error;

  const rows = (subscriptions || []) as SubscriptionRow[];
  let sent = 0;
  let gone = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const result = await sendOne(row, payload);
      if (result === "sent") sent += 1;
      else gone += 1;
    } catch (err) {
      failed += 1;
      console.error("push failed:", err);
    }
  }

  return Response.json({ sent, gone, failed, total: rows.length });
});