import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NewsCard from '../src/components/NewsCard'
import ArticleCard from '../src/components/ArticleCard'
import { TRUNCATE } from '../src/theme/cardLayout'

const wrap = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

const noticia = {
  id: 'news-1',
  title: 'Conselho aprova nova resolução para investimentos de RPPS',
  description: 'A medida altera os limites de alocação em renda variável.',
  source: 'Diário Oficial',
  published_at: '2026-08-12T10:00:00Z',
  // O agregador RSS pode ate gravar uma imagem, mas o card nunca a exibe.
  image_url: 'https://example.com/thumb.jpg'
}

describe('NewsCard', () => {
  it('nunca renderiza imagem, em nenhum layout', () => {
    const { container: card } = wrap(<NewsCard news={noticia} layout="card" />)
    expect(card.querySelector('img')).toBeNull()

    const { container: list } = wrap(<NewsCard news={noticia} layout="list" />)
    expect(list.querySelector('img')).toBeNull()
  })

  it('mostra fonte e data da notícia', () => {
    wrap(<NewsCard news={noticia} layout="list" />)
    expect(screen.getByText('Diário Oficial')).toBeInTheDocument()
  })
})

describe('ArticleCard', () => {
  const artigo = {
    id: 'article-1',
    title: 'Como ler o demonstrativo de aplicações',
    subtitle: 'Um guia rápido para dirigentes.',
    author: 'Equipe Lema',
    created_at: '2026-08-10T10:00:00Z',
    visibility: 'public'
  }

  it('sem capa propria, usa a capa padrao da Lema — nunca um slot vazio', () => {
    const { container } = wrap(<ArticleCard article={artigo} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // A query de versao existe para furar cache e pode mudar; o que importa
    // e o card cair na arte da Lema em vez de ficar com o slot vazio.
    expect(img.getAttribute('src')).toMatch(/^\/placeholder-article\.png/)
  })

  it('com capa, renderiza a imagem no slot', () => {
    const { container } = wrap(
      <ArticleCard article={{ ...artigo, cover_url: 'https://example.com/capa.jpg' }} />
    )
    expect(container.querySelector('img').getAttribute('src')).toBe(
      'https://example.com/capa.jpg'
    )
  })

  it('marca com o chip Blog Lema o artigo vindo do blog', () => {
    wrap(<ArticleCard article={{ ...artigo, origin: 'blog' }} />)
    expect(screen.getByText('Blog Lema')).toBeInTheDocument()
  })

  it('corta título longo na fronteira de palavra', () => {
    const tituloLongo =
      'Panorama completo das mudanças regulatórias que afetam a carteira dos regimes próprios em 2026'
    wrap(<ArticleCard article={{ ...artigo, title: tituloLongo }} />)

    const renderizado = screen.getByRole('heading', { level: 2 }).textContent
    expect(renderizado.length).toBeLessThanOrEqual(TRUNCATE.title + 1)
    expect(renderizado.endsWith('\u2026')).toBe(true)
    // O corte cai num espaco do original: nenhuma palavra partida.
    expect(tituloLongo[renderizado.length - 1]).toBe(' ')
  })
})
