// Edge Function news-ingest: busca noticias sobre RPPS e investimentos na
// NewsAPI e grava na tabela `news` (dedupe por url). Agendada via pg_cron +
// pg_net (mesmo padrao do notification-scheduler) — ver runbook de deploy.
//
// Chamada server-to-server com service_role (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const newsApiKey = Deno.env.get("NEWSAPI_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

const NEWS_API_URL = "https://newsapi.org/v2/everything";
const QUERY = '"previdência social" OR RPPS OR "investimentos públicos"';
const LANGUAGE = "pt";
const PAGE_SIZE = 50;

interface NewsApiArticle {
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
  source?: { name?: string };
}

interface NewsRow {
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  published_at: string;
}

async function fetchNews(): Promise<NewsRow[]> {
  const params = new URLSearchParams({
    q: QUERY,
    language: LANGUAGE,
    sortBy: "publishedAt",
    pageSize: String(PAGE_SIZE)
  });

  const res = await fetch(`${NEWS_API_URL}?${params.toString()}`, {
    headers: { "X-Api-Key": newsApiKey }
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`NewsAPI ${res.status}: ${detail.slice(0, 200)}`);
  }

  const body = (await res.json()) as { articles?: NewsApiArticle[] };
  const articles = body.articles || [];

  const rows: NewsRow[] = [];
  for (const a of articles) {
    const title = (a.title || "").trim();
    const url = (a.url || "").trim();
    if (!title || !url) continue;
    rows.push({
      title,
      description: (a.description || "").trim() || null,
      url,
      image_url: (a.urlToImage || "").trim() || null,
      source: (a.source?.name || "").trim() || null,
      published_at: a.publishedAt || new Date().toISOString()
    });
  }

  return rows;
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let rows: NewsRow[];
  try {
    rows = await fetchNews();
  } catch (err) {
    console.error("news-ingest fetch error", err);
    return new Response(`Falha ao buscar noticias: ${err.message}`, {
      status: 502
    });
  }

  if (rows.length === 0) {
    return Response.json({ inserted: 0, fetched: 0 });
  }

  const { error } = await supabase.from("news").upsert(rows, {
    onConflict: "url",
    ignoreDuplicates: true
  });

  if (error) {
    console.error("news-ingest insert error", error.message);
    return new Response(`Falha ao gravar noticias: ${error.message}`, {
      status: 500
    });
  }

  return Response.json({ inserted: rows.length, fetched: rows.length });
});
