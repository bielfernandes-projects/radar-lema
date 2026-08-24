import { describe, it, expect } from 'vitest'
import {
  CARD_HEIGHT_TEXT_ONLY,
  CARD_HEIGHT_WITH_MEDIA,
  NEWS_ROW_HEIGHT,
  SLOT
} from '../src/theme/cardLayout'

/**
 * A simetria das grades depende de uma altura fixa por card. O unico jeito de
 * ela quebrar e a soma dos slots passar dessa altura — o conteudo vaza e a
 * linha inteira desalinha. Estes testes travam a aritmetica de cada composicao
 * real, para que aumentar uma contagem de linhas ou acrescentar um slot no
 * futuro falhe aqui em vez de falhar na tela.
 */

const title = (lines) => lines * SLOT.titleLine + SLOT.titleMargin
const body = (lines) => lines * SLOT.bodyLine
const meta = SLOT.meta + SLOT.metaMargin
const footer = (content = SLOT.footer) => content + SLOT.footerMargin

const compositions = [
  {
    nome: 'EventCard',
    altura: CARD_HEIGHT_WITH_MEDIA,
    slots: [
      SLOT.media,
      SLOT.contentPadding,
      title(2),
      // Duas linhas de metadado (data e local) com 4px de espacamento.
      2 * SLOT.bodyLine + 4,
      SLOT.spacerMin,
      footer(24)
    ]
  },
  {
    nome: 'ArticleCard',
    altura: CARD_HEIGHT_WITH_MEDIA,
    slots: [SLOT.media, SLOT.contentPadding, meta, title(2), body(2), SLOT.spacerMin, footer()]
  },
  {
    nome: 'UnoUpdateCard',
    altura: CARD_HEIGHT_TEXT_ONLY,
    slots: [SLOT.contentPadding, meta, title(2), body(4), SLOT.spacerMin]
  },
  {
    nome: 'MaterialCard',
    altura: CARD_HEIGHT_TEXT_ONLY,
    slots: [
      SLOT.contentPadding,
      meta,
      title(2),
      body(2),
      SLOT.spacerMin,
      footer(SLOT.smallButton)
    ]
  },
  {
    nome: 'NewsCard layout="card"',
    altura: CARD_HEIGHT_TEXT_ONLY,
    slots: [SLOT.contentPadding, meta, title(2), body(4), SLOT.spacerMin]
  },
  {
    nome: 'NewsCard layout="list" (xs)',
    altura: NEWS_ROW_HEIGHT.xs,
    slots: [SLOT.contentPadding, meta, title(2), body(2), SLOT.spacerMin]
  },
  {
    nome: 'NewsCard layout="list" (sm+)',
    altura: NEWS_ROW_HEIGHT.sm,
    slots: [SLOT.contentPadding, meta, title(1), body(2), SLOT.spacerMin]
  }
]

describe('geometria dos cards', () => {
  it.each(compositions)('$nome cabe na altura fixa', ({ altura, slots }) => {
    const somaDosSlots = slots.reduce((total, slot) => total + slot, 0)
    expect(somaDosSlots).toBeLessThanOrEqual(altura)
  })

  it.each(compositions)('$nome nao deixa folga exagerada', ({ altura, slots }) => {
    const somaDosSlots = slots.reduce((total, slot) => total + slot, 0)
    // Folga acima de 48px significa card com bloco vazio visivel no rodape.
    expect(altura - somaDosSlots).toBeLessThanOrEqual(48)
  })
})
