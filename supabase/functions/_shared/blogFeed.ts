/**
 * Leitura do feed RSS do blog da Lema e da capa de cada post.
 * Logica pura, separada da Edge Function `blog-ingest` para ser testada pelo Vitest.
 */

export const SITE = "https://www.lemaef.com.br";

export interface FeedItem {
  title: string;
  link: string;
  slug: string;
  teaser: string;
  publishedAt: string;
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

/** Conteudo de <tag>...</tag> dentro de um bloco do feed (aceita CDATA). */
function tagText(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
}

/** Ultimo segmento do caminho do link: `/blog/<slug>/` e `/<slug>/` (links antigos) dao o mesmo slug. */
export function slugOf(link: string): string {
  return link.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
}

/** Itens validos do feed (com titulo, link e data), sem slug repetido. */
export function parseFeed(xml: string): FeedItem[] {
  const seen = new Set<string>();
  const items: FeedItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const link = stripHtml(tagText(block, "link"));
    const slug = slugOf(link);
    const published = new Date(tagText(block, "pubDate"));
    const title = stripHtml(tagText(block, "title"));
    if (!link || !slug || !title || isNaN(published.getTime()) || seen.has(slug)) continue;
    seen.add(slug);
    items.push({
      title,
      link,
      slug,
      teaser: stripHtml(tagText(block, "description")),
      publishedAt: published.toISOString()
    });
  }
  return items;
}

/**
 * Capa do post: a primeira imagem otimizada (`/_astro/...`) da pagina — o `og:image` do site
 * e sempre a imagem padrao, nao a do post. Pagina sem imagem devolve null (o card cai na arte
 * padrao da Lema).
 */
export function extractCoverUrl(html: string): string | null {
  const m = html.match(/<img[^>]+src="(\/_astro\/[^"]+\.(?:webp|png|jpe?g))"/i);
  return m ? `${SITE}${m[1]}` : null;
}
