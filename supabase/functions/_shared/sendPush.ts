// Helper compartilhado para chamar a Edge Function `send-push` server-to-server
// (autenticada com a service_role). Usado pelo `notification-scheduler` e pelo
// `news-ingest`.

interface SendPushResult {
  sent?: number;
  gone?: number;
  failed?: number;
  total?: number;
}

interface SendPushBody {
  userIds?: string[];
  eventCategoryIds?: string[];
  audience?: "all" | "uno_clients";
  topic?: "news" | "articles" | "materials" | "uno_updates";
  payload: { title: string; body?: string; eventId?: string; url?: string };
}

export function makeCallSendPush(supabaseUrl: string, serviceRole: string) {
  const url = `${supabaseUrl}/functions/v1/send-push`;

  return async function callSendPush(
    body: SendPushBody
  ): Promise<{ ok: boolean; result?: SendPushResult }> {
    try {
      const res = await fetch(url, {
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
  };
}
