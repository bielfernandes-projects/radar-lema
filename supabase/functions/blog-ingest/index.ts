// Edge Function blog-ingest: agrega artigos publicados no blog da Lema
// (https://www.lemaef.com.br/blog/) na tabela `articles` via REST API do
// WordPress com _embed, espelha as capas no bucket `article-covers`, e rastreia
// exclusões via tombstones.
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

interface WPMedia {
  id: number;
  media_details?: {
    sizes?: Record<
      string,
      { source_url: string; width: number; height: number }
    >;
  };
}

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content?: { rendered: string };
  link: string;
  date_gmt: string;
  modified_gmt: string;
  _embedded?: {
    "wp:featuredmedia"?: WPMedia[];
  };
}

interface ArticleRow {
  title: string;
  subtitle: string;
  body: string;
  author: string;
  source_url: string;
  cover_url: string | null;
  visibility: string;
  origin: string;
  source_id: string;
  source_modified_at: string;
  source_cover_url: string | null;
  created_at: string;
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
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

function extractExcerpt(rendered: string): string {
  let text = stripHtml(rendered);
  // Remove o marcador [&hellip;] do WordPress.
  text = text.replace(/\s*\[…\]\s*$/, "").replace(/\s*\[&hellip;\]\s*$/, "");
  return text.trim();
}

async function downloadCover(
  mediaUrl: string,
  sourceId: string
): Promise<{ bucket_url: string; error?: string } | null> {
  try {
    const res = await fetch(mediaUrl, {
      headers: { "User-Agent": "RadarLema-BlogIngest/1.0" },
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      return { bucket_url: "", error: `HTTP ${res.status} baixando capa` };
    }

    const blob = await res.blob();
    const ext = mediaUrl.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `${sourceId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(fileName, blob, { upsert: true });

    if (uploadError) {
      return { bucket_url: "", error: uploadError.message };
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(COVER_BUCKET).getPublicUrl(fileName);

    return { bucket_url: publicUrl };
  } catch (err) {
    return {
      bucket_url: "",
      error: err instanceof Error ? err.message : "Erro desconhecido"
    };
  }
}

interface EmbeddedMedia {
  id?: number;
  media_details?: {
    sizes?: Record<
      string,
      { source_url: string; width: number; height: number }
    >;
  };
  embeddable?: boolean;
  href?: string;
}

async function getCoverUrl(post: WPPost): Promise<string | null> {
  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0] as
    | EmbeddedMedia
    | undefined;
  if (!featuredMedia) return null;

  let media = featuredMedia;

  // Se o media não tem media_details (não foi expandido), busca diretamente.
  if (!media.media_details && media.href && media.embeddable) {
    try {
      const res = await fetch(media.href, {
        headers: { "User-Agent": "RadarLema-BlogIngest/1.0" },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        media = (await res.json()) as EmbeddedMedia;
      }
    } catch {
      // Se falhar a busca, continua com o que tem (ou nada).
    }
  }

  const sizes = media.media_details?.sizes;
  for (const size of ["medium", "medium_large", "full"]) {
    if (sizes?.[size]?.source_url) {
      return sizes[size].source_url;
    }
  }

  return null;
}

async function fetchBlogPosts(page: number = 1): Promise<{
  posts: WPPost[];
  found: number;
}> {
  const url = new URL(BLOG_API);
  url.searchParams.set("per_page", "50");
  url.searchParams.set("page", String(page));
  url.searchParams.set("_embed", "true");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "RadarLema-BlogIngest/1.0" },
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} buscando posts do blog`);
  }

  const posts: WPPost[] = await res.json();
  const total = parseInt(res.headers.get("X-WP-Total") || "0", 10);

  return { posts, found: total };
}

async function getExistingArticles(): Promise<
  Map<string, { modified_at: string; cover_url: string | null }>
> {
  const { data, error } = await supabase
    .from("articles")
    .select("source_id, source_modified_at, source_cover_url")
    .eq("origin", "blog")
    .not("source_id", "is", null);

  if (error) {
    throw new Error(`Erro buscando artigos existentes: ${error.message}`);
  }

  const map = new Map();
  for (const row of data || []) {
    map.set(row.source_id, {
      modified_at: row.source_modified_at,
      cover_url: row.source_cover_url
    });
  }
  return map;
}

async function getTombstones(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("article_ingest_tombstones")
    .select("source_id");

  if (error) {
    throw new Error(`Erro buscando tombstones: ${error.message}`);
  }

  return new Set((data || []).map((row) => row.source_id));
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
    const coversToDownload: { post: WPPost; sourceUrl: string }[] = [];
    const coverDownloads: Map<string, string | null> = new Map();

    // Processa posts em paralelo para buscar covers.
    const postPromises = posts.map(async (post) => {
      const sourceId = String(post.id);

      // Pula se foi excluído.
      if (tombstones.has(sourceId)) {
        return { shouldSkip: true };
      }

      // Pula se existe e não mudou.
      const existing_row = existing.get(sourceId);
      if (existing_row) {
        // Compara timestamps normalizados (elimina diferenças de formato).
        const existingTime = new Date(existing_row.modified_at).getTime();
        const postTime = new Date(post.modified_gmt).getTime();
        if (existingTime === postTime) {
          return { shouldSkip: true };
        }
      }

      // Busca capa se mudou ou é nova.
      const coverUrl = await getCoverUrl(post);
      if (coverUrl) {
        if (!existing_row || existing_row.cover_url !== coverUrl) {
          coversToDownload.push({ post, sourceUrl: coverUrl });
        }
        coverDownloads.set(sourceId, coverUrl);
      } else {
        coverDownloads.set(sourceId, null);
      }

      return {
        shouldSkip: false,
        sourceId,
        post,
        coverUrl,
        existing_row
      };
    });

    const processedPosts = await Promise.all(postPromises);
    let skipped = 0;

    for (const result of processedPosts) {
      if (result.shouldSkip) {
        skipped++;
        continue;
      }

      const { sourceId, post, coverUrl } = result;

      rows.push({
        title: stripHtml(post.title.rendered),
        subtitle: extractExcerpt(post.excerpt.rendered),
        body: extractExcerpt(post.excerpt.rendered),
        author: "Lema",
        source_url: post.link,
        cover_url: null, // Será preenchido após download
        visibility: "public",
        origin: "blog",
        source_id: sourceId,
        source_modified_at: post.modified_gmt,
        source_cover_url: coverUrl,
        created_at: post.date_gmt
      });
    }

    // Baixa as capas em paralelo.
    for (const { post, sourceUrl } of coversToDownload) {
      const result = await downloadCover(sourceUrl, String(post.id));
      if (result?.bucket_url) {
        // Atualiza o cover_url nas rows que serão inseridas.
        const row = rows.find((r) => r.source_id === String(post.id));
        if (row) {
          row.cover_url = result.bucket_url;
        }
      }
    }

    // Insere/atualiza os artigos.
    let inserted = 0;
    let updated = 0;

    if (rows.length > 0) {
      // Conta quantos já existem antes do upsert.
      const existingSourceIds = Array.from(existing.keys());
      const isNewCount = rows.filter((r) => !existingSourceIds.includes(r.source_id)).length;

      const { error: upsertError } = await supabase
        .from("articles")
        .upsert(rows, {
          onConflict: "source_id",
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error("blog-ingest upsert error", upsertError.message);
        return new Response(
          `Falha ao gravar artigos: ${upsertError.message}`,
          { status: 500 }
        );
      }

      inserted = isNewCount;
      updated = rows.length - isNewCount;
    }

    return Response.json({
      inserted,
      updated,
      skipped,
      total_in_blog: found,
      processed: rows.length + skipped
    });
  } catch (err) {
    console.error("blog-ingest error", err);
    return new Response(
      `Erro na ingestão: ${
        err instanceof Error ? err.message : "Erro desconhecido"
      }`,
      { status: 500 }
    );
  }
});
