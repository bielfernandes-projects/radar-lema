/**
 * Push de interacoes nos comentarios do usuario (curtida e resposta).
 * Logica pura, separada do scheduler para ser testada pelo Vitest.
 */

export interface PendingInteraction {
  id: string;
  user_id: string;
  kind: "comment_like" | "comment_reply";
  actor_name: string | null;
  content_type: string;
  content_id: string;
  snippet: string | null;
}

const DETAIL_PATH: Record<string, string> = {
  article: "/artigo/",
  event: "/evento/",
  news: "/noticia/",
  uno_update: "/novidade/"
};

export function contentPath(contentType: string, contentId: string): string {
  const base = DETAIL_PATH[contentType];
  return base ? `${base}${contentId}` : "/";
}

export function groupByUser(items: PendingInteraction[]): Map<string, PendingInteraction[]> {
  const byUser = new Map<string, PendingInteraction[]>();
  for (const item of items) {
    byUser.set(item.user_id, [...(byUser.get(item.user_id) ?? []), item]);
  }
  return byUser;
}

/** Uma interacao vira um aviso especifico; varias viram um resumo (sem floodar o aparelho). */
export function buildInteractionPush(items: PendingInteraction[]) {
  if (items.length === 1) {
    const [item] = items;
    const who = item.actor_name || "Alguém";
    const action = item.kind === "comment_like" ? "curtiu seu comentário" : "respondeu ao seu comentário";
    return {
      title: `${who} ${action}`,
      body: item.snippet ?? "Toque para ver.",
      url: contentPath(item.content_type, item.content_id)
    };
  }
  return {
    title: "RPPApp",
    body: `Você tem ${items.length} novas interações nos seus comentários.`,
    url: "/"
  };
}
