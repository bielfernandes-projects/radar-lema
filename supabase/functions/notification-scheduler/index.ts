import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { makeCallSendPush } from "../_shared/sendPush.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const callSendPush = makeCallSendPush(supabaseUrl, serviceRole);

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 1) Eventos novos confirmados aguardando aviso.
  const { data: pending, error: outboxError } = await supabase
    .from("notification_outbox")
    .select(
      "event_id, events(title, event_categories(category_id))"
    )
    .is("dispatched_at", null)
    .limit(10);

  if (outboxError) console.error("outbox error", outboxError.message);

  for (const row of pending || []) {
    const event = row.events;
    const categoryIds = (event?.event_categories || []).map(
      (c: { category_id: string }) => c.category_id
    );

    const outcome = await callSendPush({
      eventCategoryIds: categoryIds,
      payload: {
        title: `Novo evento: ${event.title}`,
        body: "Um novo evento das suas categorias foi publicado.",
        eventId: row.event_id
      }
    });

    if (outcome.ok) {
      await supabase
        .from("notification_outbox")
        .update({
          dispatched_at: new Date().toISOString(),
          result: outcome.result ?? {}
        })
        .eq("event_id", row.event_id);
    }
  }

  // 2) Lembretes vencidos (janela de ~1 min antes do inicio, canal push).
  const { data: due, error: dueError } = await supabase.rpc(
    "get_due_reminders"
  );

  if (dueError) console.error("get_due_reminders error", dueError.message);

  for (const r of (due || []) as {
    user_id: string;
    event_id: string;
    event_title: string;
    session_id: string;
    offset_minutes: number;
  }[]) {
    const outcome = await callSendPush({
      userIds: [r.user_id],
      payload: {
        title: `Lembrete: ${r.event_title}`,
        body: `Começa em ${r.offset_minutes} min. Abra o evento.`,
        eventId: r.event_id
      }
    });

    if (outcome.ok) {
      await supabase.from("reminder_dispatch").insert({
        user_id: r.user_id,
        event_id: r.event_id,
        session_id: r.session_id,
        offset_minutes: r.offset_minutes,
        channel: "push",
        result: outcome.result ?? {}
      });
    }
  }

  // 3) Outbox do hub: novidades UNO, artigos e materiais de apoio.
  const { data: hubPending, error: hubError } = await supabase
    .from("v_hub_notification_outbox")
    .select("id, content_type, content_id, title, visibility")
    .limit(50);

  if (hubError) console.error("hub outbox error", hubError.message);

  type HubRow = {
    id: string;
    content_type: "uno_update" | "article" | "material";
    content_id: string;
    title: string;
    visibility: string | null;
  };
  const hubRows = (hubPending || []) as HubRow[];

  const markHubDispatched = (ids: string[]) =>
    supabase
      .from("hub_notification_outbox")
      .update({ dispatched_at: new Date().toISOString() })
      .in("id", ids);

  // 3a) Novidades UNO — uma notificação por item (são raras e individuais).
  for (const row of hubRows.filter((r) => r.content_type === "uno_update")) {
    const outcome = await callSendPush({
      audience: "all",
      topic: "uno_updates",
      payload: {
        title: `Novidade UNO: ${row.title}`,
        body: "Atualizações e avisos do sistema UNO.",
        url: `/novidade/${row.content_id}`
      }
    });
    if (outcome.ok) await markHubDispatched([row.id]);
  }

  // 3b) Artigos e materiais — agrupados por rodada para não floodar
  // (ex.: backlog do blog-ingest). 1 item = título; N itens = contagem.
  const groups = [
    { type: "article" as const, topic: "articles" as const, one: "Novo artigo", many: "novos artigos", list: "/artigos", detail: (id: string) => `/artigo/${id}` },
    { type: "material" as const, topic: "materials" as const, one: "Novo material de apoio", many: "novos materiais de apoio", list: "/materiais", detail: (_id: string) => "/materiais" }
  ];

  for (const g of groups) {
    const items = hubRows.filter((r) => r.content_type === g.type);
    if (items.length === 0) continue;

    const buckets: [HubRow[], "all" | "uno_clients"][] = [
      [items.filter((r) => r.visibility !== "lema_client"), "all"],
      [items.filter((r) => r.visibility === "lema_client"), "uno_clients"]
    ];

    for (const [subset, audience] of buckets) {
      if (subset.length === 0) continue;
      const payload =
        subset.length === 1
          ? {
              title: `${g.one}: ${subset[0].title}`,
              body: "Toque para conferir.",
              url: g.detail(subset[0].content_id)
            }
          : {
              title: `${subset.length} ${g.many}`,
              body: "Toque para conferir.",
              url: g.list
            };
      const outcome = await callSendPush({ audience, topic: g.topic, payload });
      if (outcome.ok) await markHubDispatched(subset.map((r) => r.id));
    }
  }

  return new Response(
    JSON.stringify({
      newEvents: (pending || []).length,
      dueReminders: (due || []).length,
      hubOutbox: hubRows.length
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
