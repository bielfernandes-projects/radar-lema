import { describe, expect, it } from 'vitest'
import { extractCoverUrl, parseFeed, slugOf } from '../supabase/functions/_shared/blogFeed.ts'

// Recorte do feed real https://www.lemaef.com.br/blog/rss.xml
const FEED = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog LEMA</title>
<item><title>Boletim Econômico – 30.10.2026</title><link>https://www.lemaef.com.br/blog/boletim-economico-30-10-2026/</link><description>Ibovespa em queda &amp; Fed mantém juros.</description><pubDate>Fri, 30 Oct 2026 14:19:43 GMT</pubDate></item>
<item><title><![CDATA[Fed mantém os juros]]></title><link>https://www.lemaef.com.br/blog/fed-mantem-os-juros/</link><description><![CDATA[O Fed manteve os juros.]]></description><pubDate>Wed, 28 Oct 2026 18:26:18 GMT</pubDate></item>
<item><title>Repetido</title><link>https://www.lemaef.com.br/blog/fed-mantem-os-juros/</link><description>x</description><pubDate>Wed, 28 Oct 2026 18:26:18 GMT</pubDate></item>
<item><title>Sem data</title><link>https://www.lemaef.com.br/blog/sem-data/</link><description>x</description></item>
</channel></rss>`

describe('blogFeed', () => {
  it('slugOf: link novo (/blog/<slug>/) e link antigo (/<slug>/) dao o mesmo slug', () => {
    expect(slugOf('https://www.lemaef.com.br/blog/boletim-economico-16-10-2026/')).toBe('boletim-economico-16-10-2026')
    expect(slugOf('https://www.lemaef.com.br/boletim-economico-16-10-2026/')).toBe('boletim-economico-16-10-2026')
    expect(slugOf('https://www.lemaef.com.br/blog/x?utm=1#topo')).toBe('x')
  })

  it('parseFeed: le titulo, teaser e data; decodifica entidades e CDATA; ignora repetido e sem data', () => {
    const items = parseFeed(FEED)
    expect(items.map((i) => i.slug)).toEqual(['boletim-economico-30-10-2026', 'fed-mantem-os-juros'])
    expect(items[0]).toMatchObject({
      title: 'Boletim Econômico – 30.10.2026',
      teaser: 'Ibovespa em queda & Fed mantém juros.',
      publishedAt: '2026-10-30T14:19:43.000Z'
    })
    expect(items[1].title).toBe('Fed mantém os juros')
    expect(items[1].teaser).toBe('O Fed manteve os juros.')
  })

  it('parseFeed: feed sem itens devolve lista vazia (a funcao trata como erro, nao como sucesso)', () => {
    expect(parseFeed('<rss><channel></channel></rss>')).toEqual([])
  })

  it('extractCoverUrl: pega a primeira imagem /_astro/ da pagina, em URL absoluta', () => {
    const html = '<meta property="og:image" content="https://www.lemaef.com.br/og-default.png"><img src="/_astro/2026-10-30-capa_mODry.webp" srcset="..." class="w-full">'
    expect(extractCoverUrl(html)).toBe('https://www.lemaef.com.br/_astro/2026-10-30-capa_mODry.webp')
  })

  it('extractCoverUrl: pagina sem imagem otimizada devolve null (o card usa a arte padrao)', () => {
    expect(extractCoverUrl('<img src="https://outro.site/foto.png"><svg></svg>')).toBeNull()
  })
})
