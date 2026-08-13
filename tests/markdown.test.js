import { describe, it, expect } from 'vitest'
import { markdownToBlocks } from '../src/utils/markdown'

describe('markdownToBlocks', () => {
  it('retorna [] para entrada vazia ou em branco', () => {
    expect(markdownToBlocks('')).toEqual([])
    expect(markdownToBlocks('   \n  ')).toEqual([])
  })

  it('converte titulos de nivel 1 a 3', () => {
    const blocks = markdownToBlocks('# Titulo\n\n## Subtitulo\n\n### Seção')
    expect(blocks).toEqual([
      { type: 'heading', level: 1, text: 'Titulo' },
      { type: 'heading', level: 2, text: 'Subtitulo' },
      { type: 'heading', level: 3, text: 'Seção' }
    ])
  })

  it('converte paragrafos separados por linha em branco', () => {
    const blocks = markdownToBlocks('Primeiro paragrafo.\n\nSegundo paragrafo.')
    expect(blocks).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'Primeiro paragrafo.' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Segundo paragrafo.' }] }
    ])
  })

  it('une linhas consecutivas no mesmo paragrafo', () => {
    const blocks = markdownToBlocks('Linha 1\nLinha 2')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Linha 1\nLinha 2' }]
    })
  })

  it('parseia inline: negrito, italico, codigo e link', () => {
    const blocks = markdownToBlocks('Texto com **negrito**, *itálico*, `código` e [link](https://example.com).')
    expect(blocks[0].content).toEqual([
      { type: 'text', text: 'Texto com ' },
      { type: 'bold', text: 'negrito' },
      { type: 'text', text: ', ' },
      { type: 'italic', text: 'itálico' },
      { type: 'text', text: ', ' },
      { type: 'code', text: 'código' },
      { type: 'text', text: ' e ' },
      { type: 'link', text: 'link', href: 'https://example.com' },
      { type: 'text', text: '.' }
    ])
  })

  it('mantem HTML cru como texto (sem interpretacao)', () => {
    const blocks = markdownToBlocks('<script>alert("x")</script>')
    expect(blocks[0].content).toEqual([
      { type: 'text', text: '<script>alert("x")</script>' }
    ])
  })

  it('converte listas nao ordenadas', () => {
    const blocks = markdownToBlocks('- item um\n- item dois\n- item três')
    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [
          'item um',
          'item dois',
          'item três'
        ]
      }
    ])
  })

  it('converte listas ordenadas', () => {
    const blocks = markdownToBlocks('1. primeiro\n2. segundo')
    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: true,
        items: ['primeiro', 'segundo']
      }
    ])
  })

  it('converte bloco de codigo cercado por tres crases', () => {
    const blocks = markdownToBlocks('```\nconst a = 1\n```')
    expect(blocks).toEqual([
      { type: 'code', code: 'const a = 1' }
    ])
  })

  it('converte citação com >', () => {
    const blocks = markdownToBlocks('> Uma citação importante')
    expect(blocks).toEqual([
      { type: 'blockquote', content: [{ type: 'text', text: 'Uma citação importante' }] }
    ])
  })

  it('converte linha horizontal ---', () => {
    const blocks = markdownToBlocks('antes\n\n---\n\ndepois')
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'hr', 'paragraph'])
  })
})
