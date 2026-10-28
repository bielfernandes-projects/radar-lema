// Edge Function articles-ingest: traz artigos de fontes externas de RPPS para
// a tabela `articles`: Revista RPPS do Brasil (RSS da categoria Artigos) e
// Panorama RPPS (sem RSS: le o sitemap.xml e as meta tags de cada post).
// Os artigos da propria Lema seguem no `blog-ingest`.
//
// Mesmo contrato do blog-ingest: dedupe por `source_id` (namespaced pela
// fonte, ex. "revista:/slug/"), tombstone para o que o staff excluiu e o
// que ja foi gravado nao e reescrito (edicao do staff se mantem).
//
// ponytail: a capa e usada direto da fonte (hotlink), sem espelhar no bucket
// como o blog-ingest faz. Se uma fonte derrubar imagens, o card ja cai na
// capa padrao; espelhar so se isso virar problema real.
//
// Agendada via pg_cron + pg_net (job `radar-articles-ingest`). Chamada
// server-to-server com service_role (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const USER_AGENT = "RPPapp-ArticlesIngest/1.0";
const REVISTA_FEED = "https://www.revistarppsdobrasil.com.br/category/artigos/feed/";
const PANORAMA_SITE = "https://panoramarpps.com.br";
// ponytail: so os 30 posts mais recentes do sitemap; subir se o blog crescer.
const PANORAMA_MAX_POSTS = 30;
const PAGE_CONCURRENCY = 4;

interface ArticleRow {
  title: string;
  subtitle: string;
  body: string;
  author: string;
  source_url: string;
  cover_url: string | null;
  source_cover_url: string | null;
  visibility: string;
  origin: string;
  source_id: string;
  source_modified_at: string;
  created_at: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true
});

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
  }
  return "";
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(s: string): string {
  return unescapeHtml(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Teaser do WordPress, sem o marcador de corte "[…]" no fim. */
function excerpt(s: string): string {
  return stripHtml(s).replace(/\s*\[(…|&hellip;)\]\s*$/, "").replace(/\s*Leia mais.*$/i, "").trim();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return (await res.text()).replace(/^﻿/, "");
}

function iso(value: string | undefined | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ---------------------------------------------------------------------------
// Revista RPPS do Brasil (RSS)
// ---------------------------------------------------------------------------
async function fromRevista(): Promise<ArticleRow[]> {
  const doc = parser.parse(await fetchText(REVISTA_FEED)) as Record<string, any>;
  const rows: ArticleRow[] = [];

  for (const item of toArray<Record<string, unknown>>(doc?.rss?.channel?.item)) {
    const title = stripHtml(textOf(item.title));
    const link = textOf(item.link).trim();
    if (!title || !link) continue;

    // Post marcado tambem como Noticias ja entra pela aba de noticias.
    const cats = toArray(item.category as unknown).map((c) => textOf(c).toLowerCase());
    if (cats.includes("notícias") || cats.includes("noticias")) continue;

    const published = iso(textOf(item.pubDate));
    if (!published) continue;

    const teaser = excerpt(textOf(item.description));
    const html = textOf(item["content:encoded"]) || textOf(item.description);
    const cover = unescapeHtml(html).match(/<img[^>]*\ssrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;

    rows.push({
      title,
      subtitle: teaser,
      body: teaser,
      author: "Revista RPPS do Brasil",
      source_url: link,
      cover_url: cover,
      source_cover_url: cover,
      visibility: "public",
      origin: "revista",
      source_id: `revista:${new URL(link).pathname}`,
      source_modified_at: published,
      created_at: published
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Panorama RPPS (sitemap + meta tags)
// ---------------------------------------------------------------------------
function meta(html: string, prop: string): string | null {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return m ? unescapeHtml(m[1]).trim() : null;
}

async function fromPanorama(): Promise<ArticleRow[]> {
  const sitemap = await fetchText(`${PANORAMA_SITE}/sitemap.xml`);
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/panoramarpps\.com\.br\/blog\/[^<]+?)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => !/\/blog\/?$/.test(u))
    .slice(0, PANORAMA_MAX_POSTS);

  const rows: ArticleRow[] = [];
  for (let i = 0; i < urls.length; i += PAGE_CONCURRENCY) {
    const batch = urls.slice(i, i + PAGE_CONCURRENCY);
    const pages = await Promise.allSettled(batch.map((u) => fetchText(u)));
    pages.forEach((page, idx) => {
      if (page.status === "rejected") {
        console.error("articles-ingest panorama", page.reason);
        return;
      }
      const url = batch[idx];
      const title = (meta(page.value, "og:title") ?? "").replace(/\s*\|\s*Panorama RPPS\s*$/i, "");
      const published = iso(meta(page.value, "article:published_time"));
      if (!title || !published) return;

      const teaser = meta(page.value, "og:description") ?? "";
      const cover = meta(page.value, "og:image");
      rows.push({
        title,
        subtitle: teaser,
        body: teaser,
        author: "Panorama RPPS",
        source_url: url,
        cover_url: cover,
        source_cover_url: cover,
        visibility: "public",
        origin: "panorama",
        source_id: `panorama:${new URL(url).pathname}`,
        source_modified_at: iso(meta(page.value, "article:modified_time")) ?? published,
        created_at: published
      });
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sources = [
    { name: "Revista RPPS do Brasil", run: fromRevista },
    { name: "Panorama RPPS", run: fromPanorama }
  ];
  const results = await Promise.allSettled(sources.map((s) => s.run()));

  const report: Array<{ name: string; fetched: number; error?: string }> = [];
  const candidates: ArticleRow[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`articles-ingest ${sources[i].name}`, error);
      report.push({ name: sources[i].name, fetched: 0, error });
      return;
    }
    report.push({ name: sources[i].name, fetched: result.value.length });
    candidates.push(...result.value);
  });

  const [{ data: existing, error: existingError }, { data: tombs, error: tombError }] = await Promise.all([
    supabase.from("articles").select("source_id, source_modified_at").in("origin", ["revista", "panorama"]),
    supabase.from("article_ingest_tombstones").select("source_id")
  ]);
  if (existingError || tombError) {
    const message = (existingError ?? tombError)!.message;
    console.error("articles-ingest lookup", message);
    return new Response(`Erro na ingestao: ${message}`, { status: 500 });
  }

  const known = new Map((existing ?? []).map((r) => [r.source_id, r.source_modified_at as string | null]));
  const deleted = new Set((tombs ?? []).map((r) => r.source_id));

  // Novo ou alterado na fonte; o que ja esta igual (e pode ter sido editado
  // pelo staff) nao e reescrito.
  const rows = candidates.filter((row) => {
    if (deleted.has(row.source_id)) return false;
    const stored = known.get(row.source_id);
    return stored === undefined || new Date(stored ?? 0).getTime() !== new Date(row.source_modified_at).getTime();
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("articles").upsert(rows, { onConflict: "source_id" });
    if (error) {
      console.error("articles-ingest upsert", error.message);
      return new Response(`Falha ao gravar artigos: ${error.message}`, { status: 500 });
    }
  }

  return Response.json({
    written: rows.length,
    new: rows.filter((r) => !known.has(r.source_id)).length,
    skipped: candidates.length - rows.length,
    sources: report
  });
});
