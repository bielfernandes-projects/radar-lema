import { describe, it, expect } from 'vitest'
import { truncateAtWord } from '../src/utils/text'

const ELLIPSIS = '\u2026'

describe('truncateAtWord', () => {
  it('devolve o texto intacto quando cabe no orcamento', () => {
    expect(truncateAtWord('Comitê de Investimentos', 40)).toBe(
      'Comitê de Investimentos'
    )
  })

  it('devolve o texto intacto quando tem exatamente o tamanho do orcamento', () => {
    expect(truncateAtWord('abcde', 5)).toBe('abcde')
  })

  it('corta na fronteira de palavra, nunca no meio dela', () => {
    const texto =
      'Análise do cenário macroeconômico e seus impactos sobre a carteira'
    const resultado = truncateAtWord(texto, 30)

    expect(resultado.endsWith(ELLIPSIS)).toBe(true)

    const cortado = resultado.slice(0, -1)
    expect(texto.startsWith(cortado)).toBe(true)
    // A palavra seguinte no original tem que comecar logo apos o corte.
    expect(texto[cortado.length]).toBe(' ')
  })

  it('nao deixa pontuacao orfa antes das reticencias', () => {
    expect(truncateAtWord('Manutenção programada, sem previsão', 22)).toBe(
      `Manutenção programada${ELLIPSIS}`
    )
  })

  it('corta no limite quando a primeira palavra e maior que o orcamento', () => {
    const palavra = 'a'.repeat(60)
    expect(truncateAtWord(palavra, 10)).toBe(`${'a'.repeat(10)}${ELLIPSIS}`)
  })

  it('normaliza quebras de linha e espacos duplos vindos do RSS', () => {
    expect(truncateAtWord('Novo   texto\n\ncom quebras', 50)).toBe(
      'Novo texto com quebras'
    )
  })

  it('devolve string vazia para valores ausentes ou orcamento invalido', () => {
    expect(truncateAtWord(null, 20)).toBe('')
    expect(truncateAtWord(undefined, 20)).toBe('')
    expect(truncateAtWord('   ', 20)).toBe('')
    expect(truncateAtWord('texto', 0)).toBe('')
  })
})
