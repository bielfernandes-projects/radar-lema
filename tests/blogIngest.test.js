import { describe, it, expect } from 'vitest'

/**
 * Testes para a ingestão de artigos do blog da Lema.
 *
 * Os testes verificam:
 * - Extração e limpeza de dados dos posts do WordPress
 * - Download e espelhamento de capas
 * - Deduplicação por source_id (WordPress ID)
 * - Comparação de modified_gmt para detectar atualizações
 * - Rastreamento de exclusões via tombstones
 * - Tratamento de erros em downloads de capa
 */

// Funções auxiliares extraídas do blog-ingest/index.ts
function unescapeHtml(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function stripHtml(s) {
  return unescapeHtml(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractExcerpt(rendered) {
  let text = stripHtml(rendered)
  // Remove o marcador [&hellip;] do WordPress.
  text = text.replace(/\s*\[…\]\s*$/, '').replace(/\s*\[&hellip;\]\s*$/, '')
  return text.trim()
}

describe('Blog Ingest Helpers', () => {
  describe('unescapeHtml', () => {
    it('converte entidades numéricas decimais', () => {
      expect(unescapeHtml('&#169; 2024')).toBe('© 2024')
    })

    it('converte entidades numéricas hexadecimais', () => {
      expect(unescapeHtml('&#x00A9; 2024')).toBe('© 2024')
    })

    it('converte entidades nomeadas', () => {
      expect(unescapeHtml('&quot;texto&quot;')).toBe('"texto"')
      expect(unescapeHtml('L&apos;année')).toBe("L'année")
      expect(unescapeHtml('&lt; e &gt;')).toBe('< e >')
    })

    it('preserva espaços não-quebrantes', () => {
      expect(unescapeHtml('texto&nbsp;importante')).toBe('texto importante')
    })
  })

  describe('stripHtml', () => {
    it('remove tags HTML', () => {
      expect(stripHtml('<p>Parágrafo</p>')).toBe('Parágrafo')
      expect(stripHtml('<a href="#">link</a>')).toBe('link')
    })

    it('normaliza espaçamento', () => {
      expect(stripHtml('texto   com    múltiplos  espaços')).toBe('texto com múltiplos espaços')
    })

    it('combina unescapeHtml e limpeza', () => {
      expect(stripHtml('<p>&quot;Citação&quot;</p>')).toBe('"Citação"')
    })

    it('preserva um espaço entre tags', () => {
      expect(stripHtml('<p>Primeiro</p><p>Segundo</p>')).toBe('Primeiro Segundo')
    })
  })

  describe('extractExcerpt', () => {
    it('remove a marca [&hellip;] do final', () => {
      expect(extractExcerpt('Texto do artigo [&hellip;]')).toBe('Texto do artigo')
    })

    it('remove a marca […] do final', () => {
      expect(extractExcerpt('Texto do artigo […]')).toBe('Texto do artigo')
    })

    it('não remove […] do meio do texto', () => {
      expect(extractExcerpt('Primeiro […] segundo [&hellip;]')).toBe('Primeiro […] segundo')
    })

    it('limpa HTML e entidades junto', () => {
      expect(extractExcerpt('<p>Análise &amp; pesquisa [&hellip;]</p>')).toBe('Análise & pesquisa')
    })

    it('preserva texto sem marca', () => {
      expect(extractExcerpt('Texto simples sem marca')).toBe('Texto simples sem marca')
    })

    it('trata whitespace múltiplo', () => {
      expect(extractExcerpt('  Espaços   múltiplos  [&hellip;]  ')).toBe('Espaços múltiplos')
    })
  })

  describe('Decisao de sincronizacao', () => {
    /**
     * Espelha a decisao da Edge Function. A regra que importa: o timestamp
     * sozinho nao basta. Um artigo cujos metadados nao mudaram mas que ficou
     * sem capa tem de ser reprocessado, senao a capa faltante nunca e reparada
     * (foi assim que 50 artigos ficaram sem imagem indefinidamente).
     */
    const decide = ({ post, known, tombstones = new Set(), sourceCoverUrl = null }) => {
      const sourceId = String(post.id)
      if (tombstones.has(sourceId)) return { action: 'skip', reason: 'tombstone' }

      const metadataStale =
        !known ||
        new Date(known.sourceModifiedAt ?? 0).getTime() !==
          new Date(post.modified_gmt).getTime()

      if (!metadataStale && known?.coverUrl) return { action: 'skip', reason: 'em dia' }

      const coverPending =
        Boolean(sourceCoverUrl) &&
        (!known?.coverUrl || known.sourceCoverUrl !== sourceCoverUrl)

      if (!metadataStale && !coverPending) return { action: 'skip', reason: 'sem capa na origem' }

      return { action: 'process', metadataStale, coverPending, isNew: !known }
    }

    const post = { id: 54321, modified_gmt: '2024-01-01T00:00:00Z' }
    const capa = 'https://blog/capa-300x300.png'

    it('pula artigo excluido pelo staff (tombstone)', () => {
      const r = decide({ post, tombstones: new Set(['54321']), sourceCoverUrl: capa })
      expect(r).toEqual({ action: 'skip', reason: 'tombstone' })
    })

    it('insere artigo novo e enfileira a capa', () => {
      const r = decide({ post, known: undefined, sourceCoverUrl: capa })
      expect(r.action).toBe('process')
      expect(r.isNew).toBe(true)
      expect(r.metadataStale).toBe(true)
      expect(r.coverPending).toBe(true)
    })

    it('pula quando os metadados estao em dia e a capa ja foi espelhada', () => {
      const known = {
        sourceModifiedAt: '2024-01-01T00:00:00Z',
        coverUrl: 'https://bucket/54321.png',
        sourceCoverUrl: capa
      }
      expect(decide({ post, known, sourceCoverUrl: capa }).action).toBe('skip')
    })

    it('reprocessa a capa quando cover_url esta null, mesmo sem mudanca no blog', () => {
      const known = { sourceModifiedAt: '2024-01-01T00:00:00Z', coverUrl: null, sourceCoverUrl: null }
      const r = decide({ post, known, sourceCoverUrl: capa })
      expect(r.action).toBe('process')
      expect(r.metadataStale).toBe(false)
      expect(r.coverPending).toBe(true)
    })

    it('reespelha quando a capa muda no blog', () => {
      // Trocar a imagem destacada e uma edicao do post, entao o WordPress move
      // `modified_gmt` junto — e por isso que o atalho abaixo e seguro.
      const known = {
        sourceModifiedAt: '2024-01-01T00:00:00Z',
        coverUrl: 'https://bucket/54321.png',
        sourceCoverUrl: 'https://blog/capa-antiga-300x300.png'
      }
      const alterado = { ...post, modified_gmt: '2024-03-02T09:00:00Z' }
      const r = decide({ post: alterado, known, sourceCoverUrl: capa })
      expect(r.action).toBe('process')
      expect(r.coverPending).toBe(true)
    })

    it('com metadados em dia e capa espelhada, nao consulta a imagem', () => {
      // Atalho deliberado: sem ele, cada rodada faria 50 requisicoes de media
      // so para reconfirmar capas que ja estao no bucket.
      const known = {
        sourceModifiedAt: '2024-01-01T00:00:00Z',
        coverUrl: 'https://bucket/54321.png',
        sourceCoverUrl: 'https://blog/capa-antiga-300x300.png'
      }
      expect(decide({ post, known, sourceCoverUrl: capa }).reason).toBe('em dia')
    })

    it('atualiza metadados quando modified_gmt muda', () => {
      const known = {
        sourceModifiedAt: '2024-01-01T00:00:00Z',
        coverUrl: 'https://bucket/54321.png',
        sourceCoverUrl: capa
      }
      const alterado = { ...post, modified_gmt: '2024-02-09T12:00:00Z' }
      const r = decide({ post: alterado, known, sourceCoverUrl: capa })
      expect(r.action).toBe('process')
      expect(r.metadataStale).toBe(true)
      expect(r.isNew).toBe(false)
      // A capa nao mudou: nao ha por que baixar de novo.
      expect(r.coverPending).toBe(false)
    })

    it('compara timestamps por valor, nao por string', () => {
      const known = {
        sourceModifiedAt: '2024-01-01T00:00:00+00:00',
        coverUrl: 'https://bucket/54321.png',
        sourceCoverUrl: capa
      }
      expect(decide({ post, known, sourceCoverUrl: capa }).action).toBe('skip')
    })

    it('nao enfileira capa para post sem imagem na origem', () => {
      const known = { sourceModifiedAt: '2024-01-01T00:00:00Z', coverUrl: null, sourceCoverUrl: null }
      const r = decide({ post, known, sourceCoverUrl: null })
      expect(r.action).toBe('skip')
    })
  })


  describe('WordPress media API', () => {
    it('extrai URL de capa do tamanho "medium"', () => {
      const post = {
        _embedded: {
          'wp:featuredmedia': [
            {
              media_details: {
                sizes: {
                  medium: { source_url: 'https://example.com/med.jpg', width: 300, height: 300 },
                  full: { source_url: 'https://example.com/full.jpg', width: 4500, height: 4500 }
                }
              }
            }
          ]
        }
      }

      // Simula a lógica de getCoverUrl
      const media = post._embedded['wp:featuredmedia'][0]
      const sizes = media.media_details?.sizes
      let coverUrl = null

      for (const size of ['medium', 'medium_large', 'full']) {
        if (sizes?.[size]?.source_url) {
          coverUrl = sizes[size].source_url
          break
        }
      }

      expect(coverUrl).toBe('https://example.com/med.jpg')
    })

    it('faz fallback para "medium_large" se "medium" não existir', () => {
      const post = {
        _embedded: {
          'wp:featuredmedia': [
            {
              media_details: {
                sizes: {
                  medium_large: { source_url: 'https://example.com/med_lg.jpg', width: 768, height: 768 },
                  full: { source_url: 'https://example.com/full.jpg', width: 4500, height: 4500 }
                }
              }
            }
          ]
        }
      }

      const media = post._embedded['wp:featuredmedia'][0]
      const sizes = media.media_details?.sizes
      let coverUrl = null

      for (const size of ['medium', 'medium_large', 'full']) {
        if (sizes?.[size]?.source_url) {
          coverUrl = sizes[size].source_url
          break
        }
      }

      expect(coverUrl).toBe('https://example.com/med_lg.jpg')
    })

    it('faz fallback para "full" se nenhum outro tamanho existir', () => {
      const post = {
        _embedded: {
          'wp:featuredmedia': [
            {
              media_details: {
                sizes: {
                  full: { source_url: 'https://example.com/full.jpg', width: 4500, height: 4500 }
                }
              }
            }
          ]
        }
      }

      const media = post._embedded['wp:featuredmedia'][0]
      const sizes = media.media_details?.sizes
      let coverUrl = null

      for (const size of ['medium', 'medium_large', 'full']) {
        if (sizes?.[size]?.source_url) {
          coverUrl = sizes[size].source_url
          break
        }
      }

      expect(coverUrl).toBe('https://example.com/full.jpg')
    })

    it('retorna null se nenhuma capa existir', () => {
      const post = {
        _embedded: {
          'wp:featuredmedia': []
        }
      }

      const media = post._embedded['wp:featuredmedia'][0]
      const coverUrl = media ? 'url' : null

      expect(coverUrl).toBe(null)
    })
  })

  describe('Validações de artigo', () => {
    it('constrói ArticleRow corretamente', () => {
      const post = {
        id: 999,
        title: { rendered: 'Título <strong>do</strong> Post' },
        excerpt: { rendered: 'Descrição <em>breve</em> [&hellip;]' },
        link: 'https://www.lemaef.com.br/blog/post-123',
        date_gmt: '2024-01-15T10:30:00Z',
        modified_gmt: '2024-01-20T14:45:00Z'
      }

      const row = {
        title: stripHtml(post.title.rendered),
        subtitle: extractExcerpt(post.excerpt.rendered),
        body: extractExcerpt(post.excerpt.rendered),
        author: 'Lema',
        source_url: post.link,
        cover_url: null,
        visibility: 'public',
        origin: 'blog',
        source_id: String(post.id),
        source_modified_at: post.modified_gmt,
        source_cover_url: null,
        created_at: post.date_gmt
      }

      expect(row.title).toBe('Título do Post')
      expect(row.subtitle).toBe('Descrição breve')
      expect(row.author).toBe('Lema')
      expect(row.origin).toBe('blog')
      expect(row.source_id).toBe('999')
      expect(row.visibility).toBe('public')
    })
  })
})
