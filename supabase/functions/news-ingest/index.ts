// Edge Function news-ingest: agrega noticias institucionais (nicho RPPS) a
// partir de feeds RSS proprios (Investidor Institucional, ABIPEM,
// Gov.br/Previdencia, Banco Central do Brasil) e de Google Alerts (RPPS,
// "Regime Proprio de Previdencia", "CMN 5.272", "CMN 4.963"), normaliza os
// itens e grava na tabela `news` (dedupe por URL original da materia).
//
// Agendada via pg_cron + pg_net (job `radar-news-ingest`, ver runbook de
// deploy). Chamada server-to-server com service_role (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false }
});

interface FeedSource {
  name: string;
  urls: string[];
  kind: "rss" | "google-alert";
  limit?: number;
}

const FEEDS: FeedSource[] = [
  {
    name: "Investidor Institucional",
    urls: ["https://investidorinstitucional.com.br/feed/"],
    kind: "rss"
  },
  {
    name: "ABIPEM",
    urls: ["https://www.abipem.org.br/feed/"],
    kind: "rss"
  },
  {
    name: "Gov.br Previdência",
    urls: ["https://www.gov.br/previdencia/pt-br/assuntos/noticias/RSS"],
    kind: "rss"
  },
  {
    name: "Banco Central do Brasil",
    urls: [
      "https://www.bcb.gov.br/api/feed/pt-br/OBCB/Noticias",
      "https://www.bcb.gov.br/api/feed/sitebcb/sitefeeds/noticias"
    ],
    kind: "rss"
  },
  {
    name: "Google Alert RPPS",
    urls: ["https://www.google.com.br/alerts/feeds/14249312833923923806/17996588319945680871"],
    kind: "google-alert",
    limit: 25
  },
  {
    name: "Google Alert Regime Próprio de Previdência",
    urls: ["https://www.google.com.br/alerts/feeds/14249312833923923806/17989988202434490029"],
    kind: "google-alert",
    limit: 25
  },
  {
    name: "Google Alert CMN 5.272",
    urls: ["https://www.google.com.br/alerts/feeds/14249312833923923806/1482783789780678458"],
    kind: "google-alert",
    limit: 25
  },
  {
    name: "Google Alert CMN 4.963",
    urls: ["https://www.google.com.br/alerts/feeds/14249312833923923806/18408053799665776990"],
    kind: "google-alert",
    limit: 25
  }
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  rpps: [
    "rpps",
    "regime próprio",
    "regimes próprios",
    "previdência social",
    "previdência pública",
    "servidor",
    "servidores",
    "fundo de pensão"
  ],
  regulamentacao: [
    "cmn 5.272",
    "cmn 4.963",
    "resolução cmn",
    "conselho monetário",
    "bacen",
    "banco central",
    "previc",
    "instrução cvm",
    "normativa",
    "legislação",
    "regulatório"
  ],
  investimentos: [
    "investimento",
    "alocação",
    "carteira",
    "rentabilidade",
    "renda fixa",
    "renda variável",
    "multimercado",
    "fundo de investimento",
    "crédito privado",
    "títulos públicos",
    "títulos privados"
  ],
  mercado: [
    "b3",
    "bolsa",
    "ações",
    "debêntures",
    "fii",
    "tesouro direto",
    "mercado financeiro",
    "asset",
    "gestora"
  ],
  economia: [
    "pib",
    "inflação",
    "selic",
    "juros",
    "câmbio",
    "déficit",
    "superávit",
    "fiscal",
    "orçamento",
    "arcabouço fiscal"
  ]
};

interface NewsRow {
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string | null;
  published_at: string;
  topic: string;
}

interface ParsedItem {
  title: string;
  url: string;
  description: string;
  image_url: string | null;
  published_at: string;
  source: string;
  topic: string;
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
    if (typeof obj["#cdata"] === "string") return obj["#cdata"];
  }
  return "";
}

function attrOf(node: unknown, attr: string): string {
  if (node == null || typeof node !== "object") return "";
  const obj = node as Record<string, unknown>;
  const value = obj[`@_${attr}`];
  return typeof value === "string" ? value : "";
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
  return unescapeHtml(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyTopic(text: string): string {
  const lower = text.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return topic;
  }
  return "outros";
}

function googleAlertUrl(link: string): string {
  try {
    const parsed = new URL(link);
    const q = parsed.searchParams.get("q") || parsed.searchParams.get("url");
    if (q) return q;
  } catch {
    // link invalido: usa como esta
  }
  return link;
}

function googleAlertSource(title: string, feedName: string): string {
  const idx = title.lastIndexOf(" - ");
  if (idx > 0) {
    const source = title.slice(idx + 3).trim();
    if (source && !source.toLowerCase().includes("google")) return source;
  }
  return feedName.replace(/^Google Alert\s+/, "").trim();
}

function extractImage(item: Record<string, unknown>, rawDescription: string): string | null {
  const mediaThumb = item["media:thumbnail"];
  const thumbUrl = attrOf(mediaThumb, "url");
  if (thumbUrl) return thumbUrl;

  for (const mc of toArray(item["media:content"] as unknown)) {
    const url = attrOf(mc, "url");
    const type = attrOf(mc, "type");
    if (url && (!type || type.startsWith("image/"))) return url;
  }

  const enclosure = item.enclosure as unknown;
  const encUrl = attrOf(enclosure, "url");
  const encType = attrOf(enclosure, "type");
  if (encUrl && (!encType || encType.startsWith("image/"))) return encUrl;

  const match = rawDescription.match(/<img[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  if (match) return match[1];

  return null;
}

function atomLink(node: unknown): string {
  const candidates = toArray(node as unknown);
  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    const href = attrOf(candidate, "href");
    if (href) return href;
  }
  return "";
}

function parseFeed(feed: FeedSource, xml: string): ParsedItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;

  let channel: Record<string, unknown>;
  let rawItems: unknown[];

  const rssRoot = doc.rss as Record<string, unknown> | undefined;
  if (rssRoot) {
    channel = (rssRoot.channel as Record<string, unknown>) ?? {};
    rawItems = toArray(channel.item as unknown);
  } else {
    const feedRoot = doc.feed as Record<string, unknown> | undefined;
    if (feedRoot) {
      channel = feedRoot;
      rawItems = toArray(feedRoot.entry as unknown);
    } else {
      return [];
    }
  }

  const nowIso = new Date().toISOString();
  const items: ParsedItem[] = [];
  for (const rawItem of rawItems.slice(0, feed.limit ?? 50)) {
    const item = (rawItem ?? {}) as Record<string, unknown>;

    const title = stripHtml(textOf(item.title));
    if (!title) continue;

    const link = (textOf(item.link).trim() || atomLink(item.link)).trim();
    if (!link) continue;

    let url = link;
    if (feed.kind === "google-alert") {
      url = googleAlertUrl(link).split("&sa=")[0];
      if (!title.includes(" - ")) continue;
    }
    url = url.trim();
    if (!url) continue;
    if (feed.kind === "google-alert" && /google\.(com|com\.br|pt)\//.test(url)) continue;

    const pubRaw = textOf(item.pubDate) || textOf(item.published) || textOf(item.updated);
    let publishedAt = nowIso;
    if (pubRaw) {
      const date = new Date(pubRaw);
      if (!isNaN(date.getTime())) publishedAt = date.toISOString();
    }

    const rawDescription = unescapeHtml(
      textOf(item.description) || textOf(item.content) || textOf(item.summary)
    );

    const source =
      feed.kind === "google-alert"
        ? googleAlertSource(title, feed.name)
        : feed.name;

    items.push({
      title,
      url,
      description: stripHtml(rawDescription) || null,
      image_url: extractImage(item, rawDescription),
      published_at: publishedAt,
      source,
      topic: classifyTopic(`${title} ${stripHtml(rawDescription)}`)
    });
  }

  return items;
}

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "RadarLema-RSS/1.0" },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);

  const xml = (await res.text()).replace(/^\uFEFF/, "");
  if (!/<\s*(rss|feed)[\s>]/i.test(xml.slice(0, 2000))) {
    throw new Error(`Resposta nao e XML em ${url}`);
  }
  return xml;
}

async function fetchFeed(feed: FeedSource): Promise<{ rows: NewsRow[]; fetched: number; valid: number }> {
  let xml = "";
  let lastError: unknown = null;
  for (const url of feed.urls) {
    try {
      xml = await fetchXml(url);
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!xml) throw lastError instanceof Error ? lastError : new Error("Nenhuma URL do feed respondeu");

  const parsed = parseFeed(feed, xml);
  const rows: NewsRow[] = parsed.map((item) => ({
    title: item.title,
    description: item.description,
    url: item.url,
    image_url: item.image_url,
    source: item.source,
    published_at: item.published_at,
    topic: item.topic
  }));

  return { rows, fetched: parsed.length, valid: rows.length };
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)));

  const allRows: NewsRow[] = [];
  const seen = new Set<string>();
  const feedReport: Array<{ name: string; fetched: number; valid: number; error?: string }> = [];

  for (const [index, result] of results.entries()) {
    const feed = FEEDS[index];
    if (result.status === "rejected") {
      feedReport.push({
        name: feed.name,
        fetched: 0,
        valid: 0,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason)
      });
      continue;
    }

    const { rows, fetched, valid } = result.value;
    feedReport.push({ name: feed.name, fetched, valid });

    for (const row of rows) {
      if (seen.has(row.url)) continue;
      seen.add(row.url);
      allRows.push(row);
    }
  }

  let inserted = 0;
  if (allRows.length > 0) {
    const { data, error } = await supabase.from("news").upsert(allRows, {
      onConflict: "url",
      ignoreDuplicates: true
    });

    if (error) {
      console.error("news-ingest insert error", error.message);
      return new Response(`Falha ao gravar noticias: ${error.message}`, {
        status: 500
      });
    }

    inserted = Array.isArray(data) ? data.length : allRows.length;
  }

  const fetched = feedReport.reduce((acc, feed) => acc + feed.fetched, 0);

  return Response.json({
    inserted,
    fetched,
    skipped: Math.max(0, fetched - inserted),
    feeds: feedReport
  });
});
