/**
 * Helpers de texto da UI do Radar Lema.
 *
 * O corte de texto dos cards e feito aqui, em JS, e nao pelo `-webkit-line-clamp`
 * do CSS: o clamp corta por caractere e parte palavra ao meio. O clamp continua
 * aplicado nos cards como rede de seguranca (zoom alto, token sem espaco), mas o
 * orcamento de caracteres e dimensionado para que ele normalmente nao dispare.
 */

const ELLIPSIS = '\u2026'

// Pontuacao que fica orfa quando o corte cai logo depois dela.
const TRAILING_PUNCTUATION = /[\s.,;:!?/\-\u2013\u2014([{"']+$/

/**
 * Corta `text` em no maximo `maxChars` caracteres, recuando ate a ultima
 * fronteira de palavra, e acrescenta reticencias. Nunca parte uma palavra ao
 * meio — a unica excecao e uma palavra unica maior que o orcamento inteiro,
 * que nao tem onde recuar.
 */
export function truncateAtWord(text, maxChars) {
  if (typeof text !== 'string') return ''

  // Descricoes vindas de RSS trazem quebras de linha e espacos duplos que
  // bagunçam a contagem de linhas do card.
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (!normalized) return ''
  if (!Number.isFinite(maxChars) || maxChars <= 0) return ''
  if (normalized.length <= maxChars) return normalized

  // +1 para que uma palavra que termina exatamente no limite ainda caiba.
  const head = normalized.slice(0, maxChars + 1)
  const lastSpace = head.lastIndexOf(' ')
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : normalized.slice(0, maxChars)
  const clean = cut.replace(TRAILING_PUNCTUATION, '')

  return `${clean || cut}${ELLIPSIS}`
}
