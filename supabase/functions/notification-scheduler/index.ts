import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const SEND_PUSH_URL = `${supabaseUrl}/functions/v1/send-push`;

interface SendPushResult {
  sent?: number;
  gone?: number;
  failed?: number;
  total?: number;
}

async function callSendPush(body: {
  userIds?: string[];
  eventCategoryIds?: string[];
  audience?: "all" | "uno_clients";
  payload: { title: string; body?: string; eventId?: string; url?: string };
}): Promise<{ ok: boolean; result?: SendPushResult }> {
  try {
    const res = await fetch(SEND_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRole}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error("send-push error", res.status, await res.text());
      return { ok: false };
    }
    let result: SendPushResult | undefined;
    try {
      result = (await res.json()) as SendPushResult;
    } catch {
      result = undefined;
    }
    return { ok: true, result };
  } catch (err) {
    console.error("send-push exception", err);
    return { ok: false };
  }
}

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

  // 3) Outbox do hub: novidades UNO (todos) e artigos exclusivos (Clientes Lema).
  const { data: hubPending, error: hubError } = await supabase
    .from("v_hub_notification_outbox")
    .select("id, content_type, content_id, title, subtitle")
    .limit(10);

  if (hubError) console.error("hub outbox error", hubError.message);

  for (const row of (hubPending || []) as {
    id: string;
    content_type: "uno_update" | "article";
    content_id: string;
    title: string;
    subtitle: string | null;
  }[]) {
    const isUpdate = row.content_type === "uno_update";
    const outcome = await callSendPush({
      audience: isUpdate ? "all" : "uno_clients",
      payload: {
        title: isUpdate
          ? `Novidade UNO: ${row.title}`
          : `Novo artigo: ${row.title}`,
        body: isUpdate
          ? "Atualizações e avisos do sistema UNO."
          : "Conteúdo exclusivo para Clientes Lema.",
        url: isUpdate
          ? `/novidade/${row.content_id}`
          : `/artigo/${row.content_id}`
      }
    });

    if (outcome.ok) {
      await supabase
        .from("hub_notification_outbox")
        .update({ dispatched_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  return new Response(
    JSON.stringify({
      newEvents: (pending || []).length,
      dueReminders: (due || []).length,
      hubOutbox: (hubPending || []).length
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
