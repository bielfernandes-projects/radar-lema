// Edge Function blog-ingest: traz os artigos publicados no blog da Lema
// (https://www.lemaef.com.br/blog/) para a tabela `articles`, via REST API do
// WordPress, e espelha as capas no bucket `article-covers`.
//
// A ingestao roda em duas fases independentes, e isso e proposital:
//
//   Fase 1 (metadados) — upsert de titulo, teaser, datas e link. NAO toca em
//   `cover_url`, entao uma falha de rede na parte de imagens nunca impede o
//   artigo de entrar, e uma capa ja espelhada nunca e apagada por engano.
//
//   Fase 2 (capas) — baixa a imagem destacada, sobe no bucket e faz um UPDATE
//   explicito de `cover_url`, conferindo o resultado. E idempotente e
//   reparadora: uma capa que faltou numa rodada e refeita na seguinte, sem
//   depender de o post ter mudado no blog.
//
// O relatorio de retorno conta as capas separadamente (`covers_ok`,
// `covers_failed`, `cover_errors`). Sem isso, uma rodada com 100% das capas
// faltando responderia "sucesso" — foi exatamente o que aconteceu antes.
//
// Agendada via pg_cron + pg_net (job `radar-blog-ingest`). Chamada
// server-to-server com service_role (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const BLOG_API = "https://www.lemaef.com.br/wp-json/wp/v2/posts";
const COVER_BUCKET = "article-covers";
const USER_AGENT = "RadarLema-BlogIngest/1.0";

/** Capas baixadas de 6 em 6: 49 imagens uma a uma nao cabem no tempo da funcao. */
const COVER_CONCURRENCY = 6;

/** Ordem de preferencia de tamanho da capa. 300px cobre o slot do card. */
const COVER_SIZES = ["medium", "medium_large", "full"];

interface WPMediaSize {
  source_url: string;
  width: number;
  height: number;
}

interface WPMedia {
  id?: number;
  media_details?: { sizes?: Record<string, WPMediaSize> };
  embeddable?: boolean;
  href?: string;
}

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  date_gmt: string;
  modified_gmt: string;
  _embedded?: { "wp:featuredmedia"?: WPMedia[] };
}

/** O que ja existe no banco, para decidir entre pular, atualizar e reparar. */
interface ExistingArticle {
  sourceModifiedAt: string | null;
  coverUrl: string | null;
  sourceCoverUrl: string | null;
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

function unescapeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(s: string): string {
  return unescapeHtml(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Teaser do WordPress, sem o marcador de corte que ele acrescenta no fim. */
function extractExcerpt(rendered: string): string {
  return stripHtml(rendered)
    .replace(/\s*\[…\]\s*$/, "")
    .replace(/\s*\[&hellip;\]\s*$/, "")
    .trim();
}

/**
 * URL da capa no tamanho preferido. O `_embed` normalmente ja traz
 * `media_details`; quando vem so o link do recurso, busca o media avulso.
 * Post sem imagem destacada (ou com media protegido) devolve null — o card
 * cai na capa padrao da Lema.
 */
async function getCoverUrl(post: WPPost): Promise<string | null> {
  let media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return null;

  if (!media.media_details && media.href && media.embeddable) {
    try {
      const res = await fetch(media.href, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) media = (await res.json()) as WPMedia;
    } catch {
      // media inacessivel: segue sem capa
    }
  }

  const sizes = media.media_details?.sizes;
  for (const size of COVER_SIZES) {
    const url = sizes?.[size]?.source_url;
    if (url) return url;
  }
  return null;
}

async function fetchBlogPosts(
  page = 1
): Promise<{ posts: WPPost[]; found: number }> {
  const url = new URL(BLOG_API);
  url.searchParams.set("per_page", "50");
  url.searchParams.set("page", String(page));
  url.searchParams.set("_embed", "true");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} buscando posts do blog`);

  return {
    posts: (await res.json()) as WPPost[],
    found: parseInt(res.headers.get("X-WP-Total") || "0", 10)
  };
}

async function getExistingArticles(): Promise<Map<string, ExistingArticle>> {
  const { data, error } = await supabase
    .from("articles")
    .select("source_id, source_modified_at, cover_url, source_cover_url")
    .eq("origin", "blog")
    .not("source_id", "is", null);

  if (error) {
    throw new Error(`Erro buscando artigos existentes: ${error.message}`);
  }

  const map = new Map<string, ExistingArticle>();
  for (const row of data || []) {
    map.set(row.source_id, {
      sourceModifiedAt: row.source_modified_at,
      coverUrl: row.cover_url,
      sourceCoverUrl: row.source_cover_url
    });
  }
  return map;
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
 * assim, se algo falhar, a proxima rodada reconhece que a capa ainda esta
 * pendente e tenta de novo.
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
  const fileName = `${job.sourceId}.${ext}`;

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

  try {
    const { posts, found } = await fetchBlogPosts(1);
    const existing = await getExistingArticles();
    const tombstones = await getTombstones();

    const rows: ArticleRow[] = [];
    const coverJobs: CoverJob[] = [];
    let skipped = 0;
    let inserted = 0;
    let updated = 0;

    const decisions = await mapLimit(posts, COVER_CONCURRENCY, async (post) => {
      const sourceId = String(post.id);

      // Excluido pelo staff: nao volta.
      if (tombstones.has(sourceId)) return null;

      const known = existing.get(sourceId);
      const metadataStale =
        !known ||
        new Date(known.sourceModifiedAt ?? 0).getTime() !==
          new Date(post.modified_gmt).getTime();

      // Nada mudou e a capa ja esta espelhada: nem consulta a imagem.
      if (!metadataStale && known?.coverUrl) return null;

      const sourceCoverUrl = await getCoverUrl(post);
      const coverPending =
        Boolean(sourceCoverUrl) &&
        (!known?.coverUrl || known.sourceCoverUrl !== sourceCoverUrl);

      // Metadados iguais e nenhuma capa a espelhar: nada a fazer.
      if (!metadataStale && !coverPending) return null;

      return {
        post,
        sourceId,
        sourceCoverUrl,
        metadataStale,
        coverPending,
        isNew: !known
      };
    });

    for (const decision of decisions) {
      if (decision.status === "rejected") {
        skipped++;
        console.error(
          "blog-ingest decisao falhou",
          errorMessage(decision.reason)
        );
        continue;
      }

      const item = decision.value;
      if (!item) {
        skipped++;
        continue;
      }

      if (item.metadataStale) {
        if (item.isNew) inserted++;
        else updated++;

        rows.push({
          title: stripHtml(item.post.title.rendered),
          subtitle: extractExcerpt(item.post.excerpt.rendered),
          body: extractExcerpt(item.post.excerpt.rendered),
          author: "Lema",
          source_url: item.post.link,
          visibility: "public",
          origin: "blog",
          source_id: item.sourceId,
          source_modified_at: item.post.modified_gmt,
          created_at: item.post.date_gmt
        });
      }

      if (item.coverPending && item.sourceCoverUrl) {
        coverJobs.push({
          sourceId: item.sourceId,
          sourceCoverUrl: item.sourceCoverUrl
        });
      }
    }

    // Fase 1 — metadados. `cover_url` fica de fora de proposito: assim o
    // upsert nunca sobrescreve uma capa ja espelhada.
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

    // Fase 2 — capas. Roda depois do upsert para que o UPDATE por `source_id`
    // encontre tambem as linhas recem-inseridas.
    const coverResults = await mapLimit(
      coverJobs,
      COVER_CONCURRENCY,
      mirrorCover
    );

    let coversOk = 0;
    const coverErrors: Array<{ source_id: string; error: string }> = [];
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
      inserted,
      updated,
      skipped,
      covers_ok: coversOk,
      covers_failed: coverErrors.length,
      cover_errors: coverErrors.slice(0, 10),
      total_in_blog: found,
      processed: posts.length
    });
  } catch (err) {
    console.error("blog-ingest error", err);
    return new Response(`Erro na ingestao: ${errorMessage(err)}`, {
      status: 500
    });
  }
});
