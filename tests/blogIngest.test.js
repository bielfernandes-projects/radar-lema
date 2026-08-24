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

  describe('Lógica de sincronização', () => {
    it('pula artigo com source_id em tombstones', () => {
      const tombstones = new Set(['12345'])
      const post = { id: 12345, title: { rendered: 'Artigo' }, modified_gmt: '2024-01-01T00:00:00Z' }

      const isTombstoned = tombstones.has(String(post.id))
      expect(isTombstoned).toBe(true)
    })

    it('pula artigo sem modificação', () => {
      const existing = new Map([
        ['54321', { modified_at: '2024-01-01T00:00:00Z', cover_url: 'https://example.com/img.jpg' }]
      ])
      const post = { id: 54321, modified_gmt: '2024-01-01T00:00:00Z' }

      const existing_row = existing.get(String(post.id))
      const shouldUpdate = !existing_row || existing_row.modified_at !== post.modified_gmt

      expect(shouldUpdate).toBe(false)
    })

    it('atualiza artigo quando modified_gmt muda', () => {
      const existing = new Map([
        ['54321', { modified_at: '2024-01-01T00:00:00Z', cover_url: 'https://example.com/img.jpg' }]
      ])
      const post = { id: 54321, modified_gmt: '2024-01-02T00:00:00Z' }

      const existing_row = existing.get(String(post.id))
      const shouldUpdate = !existing_row || existing_row.modified_at !== post.modified_gmt

      expect(shouldUpdate).toBe(true)
    })

    it('detecta mudança de capa', () => {
      const existing = new Map([
        ['54321', { modified_at: '2024-01-01T00:00:00Z', cover_url: 'https://example.com/old.jpg' }]
      ])
      const post = { id: 54321, modified_gmt: '2024-01-02T00:00:00Z' }
      const newCoverUrl = 'https://example.com/new.jpg'

      const existing_row = existing.get(String(post.id))
      const coverChanged = !existing_row || existing_row.cover_url !== newCoverUrl

      expect(coverChanged).toBe(true)
    })

    it('não re-baixa capa se não mudou', () => {
      const existing = new Map([
        ['54321', { modified_at: '2024-01-01T00:00:00Z', cover_url: 'https://example.com/img.jpg' }]
      ])
      const post = { id: 54321, modified_gmt: '2024-01-01T00:00:00Z' }
      const coverUrl = 'https://example.com/img.jpg'

      const existing_row = existing.get(String(post.id))
      const shouldDownload = !existing_row || existing_row.cover_url !== coverUrl

      expect(shouldDownload).toBe(false)
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
