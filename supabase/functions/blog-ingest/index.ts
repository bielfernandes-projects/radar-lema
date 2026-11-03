// Edge Function blog-ingest: traz os artigos publicados no blog da Lema
// (https://www.lemaef.com.br/blog/) para a tabela `articles`, pelo feed RSS
// (https://www.lemaef.com.br/blog/rss.xml), e espelha as capas no bucket `article-covers`.
//
// Historico: ate 11/2026 a fonte era a REST API do WordPress do site antigo. O site foi
// reconstruido (sem WordPress, links /blog/<slug>/), a API passou a responder 404 e a
// ingestao parou. O feed novo nao traz imagem: a capa vem da propria pagina do post.
//
// Identidade do artigo: o slug do link. Os artigos ja importados guardam o id numerico do
// WordPress em `source_id`; eles sao reconhecidos pelo slug do `source_url` e mantem o
// `source_id` antigo (capa e exclusoes continuam valendo). Artigo novo ganha `lema:<slug>`.
//
// A ingestao roda em duas fases independentes, e isso e proposital:
//
//   Fase 1 (metadados) — insere os artigos novos (titulo, teaser, data, link). NAO toca em
//   `cover_url`, entao uma falha de rede na parte de imagens nunca impede o artigo de
//   entrar. Artigo ja conhecido nao e reescrito (so o link e atualizado para /blog/<slug>/).
//
//   Fase 2 (capas) — baixa a imagem do post, sobe no bucket e faz um UPDATE explicito de
//   `cover_url`, conferindo o resultado. E idempotente e reparadora: uma capa que faltou
//   numa rodada e refeita na seguinte.
//
// O relatorio de retorno conta as capas separadamente (`covers_ok`, `covers_failed`,
// `cover_errors`): sem isso, uma rodada com 100% das capas faltando responderia "sucesso".
//
// `?quiet=1` (carga inicial/reparo): os artigos inseridos na rodada nao geram push — evita
// avisar "N novos artigos" por um backlog.
//
// Agendada via pg_cron + pg_net (job `radar-blog-ingest`). Chamada server-to-server com
// service_role (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { extractCoverUrl, parseFeed, slugOf, type FeedItem } from "../_shared/blogFeed.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const BLOG_RSS = "https://www.lemaef.com.br/blog/rss.xml";
const COVER_BUCKET = "article-covers";
const USER_AGENT = "RPPApp-BlogIngest/1.0";

/** Paginas e capas buscadas de 6 em 6: dezenas de requisicoes uma a uma nao cabem no tempo da funcao. */
const CONCURRENCY = 6;

/** O que ja existe no banco, para decidir entre pular, corrigir o link e reparar a capa. */
interface ExistingArticle {
  sourceId: string;
  sourceUrl: string | null;
  coverUrl: string | null;
}

interface ArticleRow {
  title: string;
  subtitle: string;
  body: string;
  author: string;
  source_url: string;
  visibility: string;
  origin: string;
  source_id: string;
  source_modified_at: string;
  created_at: string;
}

interface CoverJob {
  sourceId: string;
  sourceCoverUrl: string;
}

async function getCoverUrl(link: string): Promise<string | null> {
  const res = await fetch(link, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} abrindo ${link}`);
  return extractCoverUrl(await res.text());
}

async function fetchFeed(): Promise<FeedItem[]> {
  const res = await fetch(BLOG_RSS, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} buscando o feed do blog`);
  const items = parseFeed(await res.text());
  // Feed vazio/quebrado nunca deve ser tratado como "nada a fazer" com sucesso.
  if (items.length === 0) throw new Error("feed do blog sem nenhum item valido");
  return items;
}

async function getExistingArticles(): Promise<Map<string, ExistingArticle>> {
  const { data, error } = await supabase
    .from("articles")
    .select("source_id, source_url, cover_url")
    .eq("origin", "blog")
    .not("source_id", "is", null);

  if (error) {
    throw new Error(`Erro buscando artigos existentes: ${error.message}`);
  }

  const bySlug = new Map<string, ExistingArticle>();
  for (const row of data || []) {
    bySlug.set(slugOf(row.source_url ?? ""), {
      sourceId: row.source_id,
      sourceUrl: row.source_url,
      coverUrl: row.cover_url
    });
  }
  return bySlug;
}

async function getTombstones(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("article_ingest_tombstones")
    .select("source_id");

  if (error) throw new Error(`Erro buscando tombstones: ${error.message}`);
  return new Set((data || []).map((row) => row.source_id));
}

/**
 * Baixa a capa, sobe no bucket e grava a URL publica na linha do artigo.
 * `source_cover_url` so e atualizado junto com um espelhamento bem-sucedido:
 * assim, se algo falhar, a proxima rodada reconhece que a capa ainda esta pendente.
 */
async function mirrorCover(job: CoverJob): Promise<void> {
  const res = await fetch(job.sourceCoverUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} baixando a capa`);

  const blob = await res.blob();
  if (blob.size === 0) throw new Error("capa vazia (0 bytes)");

  const ext = (job.sourceCoverUrl.split(".").pop() || "jpg")
    .split("?")[0]
    .toLowerCase();
  // `lema:<slug>` tem caractere que nao serve de nome de arquivo.
  const fileName = `${job.sourceId.replace(/[^a-zA-Z0-9_-]/g, "-")}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(fileName, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg"
    });
  if (uploadError) throw new Error(`upload: ${uploadError.message}`);

  const {
    data: { publicUrl }
  } = supabase.storage.from(COVER_BUCKET).getPublicUrl(fileName);
  if (!publicUrl) throw new Error("bucket nao devolveu URL publica");

  const { data: updatedRows, error: updateError } = await supabase
    .from("articles")
    .update({ cover_url: publicUrl, source_cover_url: job.sourceCoverUrl })
    .eq("source_id", job.sourceId)
    .select("id");

  if (updateError) throw new Error(`update: ${updateError.message}`);
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("update nao atingiu nenhuma linha");
  }
}

/** Executa `fn` sobre os itens com no maximo `limit` em voo ao mesmo tempo. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        try {
          results[index] = {
            status: "fulfilled",
            value: await fn(items[index])
          };
        } catch (err) {
          results[index] = { status: "rejected", reason: err };
        }
      }
    }
  );

  await Promise.all(workers);
  return results;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const quiet = new URL(req.url).searchParams.get("quiet") === "1";

  try {
    const feed = await fetchFeed();
    const existing = await getExistingArticles();
    const tombstones = await getTombstones();

    const rows: ArticleRow[] = [];
    const linkFixes: Array<{ sourceId: string; link: string }> = [];
    const coverCandidates: Array<{ sourceId: string; link: string }> = [];
    let skipped = 0;

    for (const item of feed) {
      const known = existing.get(item.slug);
      const sourceId = known?.sourceId ?? `lema:${item.slug}`;

      // Excluido pelo staff: nao volta.
      if (tombstones.has(sourceId)) {
        skipped++;
        continue;
      }

      if (!known) {
        rows.push({
          title: item.title,
          subtitle: item.teaser,
          body: item.teaser,
          author: "Lema",
          source_url: item.link,
          visibility: "public",
          origin: "blog",
          source_id: sourceId,
          source_modified_at: item.publishedAt,
          created_at: item.publishedAt
        });
      } else if (known.sourceUrl !== item.link) {
        linkFixes.push({ sourceId, link: item.link });
      }

      // Capa pendente: artigo novo ou conhecido que ficou sem capa.
      if (!known?.coverUrl) coverCandidates.push({ sourceId, link: item.link });
    }

    // Fase 1 — metadados dos artigos novos. `cover_url` fica de fora de proposito.
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("articles")
        .upsert(rows, { onConflict: "source_id", ignoreDuplicates: false });

      if (upsertError) {
        console.error("blog-ingest upsert error", upsertError.message);
        return new Response(`Falha ao gravar artigos: ${upsertError.message}`, {
          status: 500
        });
      }
    }

    // Os links antigos (/<slug>/) passam a apontar para /blog/<slug>/.
    await mapLimit(linkFixes, CONCURRENCY, async (fix) => {
      const { error } = await supabase
        .from("articles")
        .update({ source_url: fix.link })
        .eq("source_id", fix.sourceId);
      if (error) throw new Error(error.message);
    });

    // Carga inicial: sem push para o backlog. O trigger ja enfileirou no outbox; marca como
    // despachado so os artigos inseridos nesta rodada.
    if (quiet && rows.length > 0) {
      const { data: inserted } = await supabase
        .from("articles")
        .select("id")
        .in("source_id", rows.map((r) => r.source_id));
      const ids = (inserted || []).map((a) => a.id);
      if (ids.length > 0) {
        await supabase
          .from("hub_notification_outbox")
          .update({ dispatched_at: new Date().toISOString() })
          .eq("content_type", "article")
          .in("content_id", ids)
          .is("dispatched_at", null);
      }
    }

    // Fase 2 — capas. Descobre a imagem de cada post sem capa e espelha no bucket.
    const resolved = await mapLimit(coverCandidates, CONCURRENCY, async (c) => ({
      sourceId: c.sourceId,
      sourceCoverUrl: await getCoverUrl(c.link)
    }));

    const coverErrors: Array<{ source_id: string; error: string }> = [];
    const coverJobs: CoverJob[] = [];
    let withoutImage = 0; // post sem imagem: o card usa a arte padrao da Lema
    resolved.forEach((result, index) => {
      if (result.status === "rejected") {
        coverErrors.push({
          source_id: coverCandidates[index].sourceId,
          error: errorMessage(result.reason)
        });
      } else if (result.value.sourceCoverUrl) {
        coverJobs.push({
          sourceId: result.value.sourceId,
          sourceCoverUrl: result.value.sourceCoverUrl
        });
      } else {
        withoutImage++;
      }
    });

    const coverResults = await mapLimit(coverJobs, CONCURRENCY, mirrorCover);
    let coversOk = 0;
    coverResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        coversOk++;
        return;
      }
      const message = errorMessage(result.reason);
      console.error(
        `blog-ingest capa falhou (source_id=${coverJobs[index].sourceId})`,
        message
      );
      coverErrors.push({ source_id: coverJobs[index].sourceId, error: message });
    });

    return Response.json({
      inserted: rows.length,
      links_fixed: linkFixes.length,
      skipped,
      covers_ok: coversOk,
      covers_without_image: withoutImage,
      covers_failed: coverErrors.length,
      cover_errors: coverErrors.slice(0, 10),
      total_in_feed: feed.length,
      quiet
    });
  } catch (err) {
    console.error("blog-ingest error", err);
    return new Response(`Erro na ingestao: ${errorMessage(err)}`, {
      status: 500
    });
  }
});
