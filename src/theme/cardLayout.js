/**
 * Geometria dos cards do hub.
 *
 * Fonte unica de altura e de slot: nenhum card define altura por conta propria.
 * O problema que isso resolve e que `height: '100%'` no MUI Grid so iguala os
 * cards da mesma linha — linhas diferentes ficavam com alturas diferentes.
 *
 * Duas regras sustentam a simetria:
 *  1. cada slot tem `minHeight`, entao campo opcional vazio nao encolhe o card;
 *  2. a altura e fixa e o conteudo e flex column com um espacador antes do
 *     rodape, entao a folga sobra sempre no mesmo lugar e o rodape fica
 *     ancorado embaixo.
 */

export const CARD_MEDIA_HEIGHT = 160

/** Evento e artigo — cards com capa. */
export const CARD_HEIGHT_WITH_MEDIA = 380

/** Noticia (carrossel mobile), novidade UNO e material — cards so de texto. */
export const CARD_HEIGHT_TEXT_ONLY = 216

/** Linha da lista de /noticias: titulo em 2 linhas no mobile, 1 no desktop. */
export const NEWS_ROW_HEIGHT = { xs: 176, sm: 148 }

const TITLE_LINE_HEIGHT_PX = 26
const BODY_LINE_HEIGHT_PX = 21
const META_SLOT_HEIGHT = 24
const FOOTER_SLOT_HEIGHT = 24

/**
 * Altura de cada peca da composicao, em px. Exportado para que
 * `tests/cardLayout.test.js` possa somar os slots de cada card e provar que a
 * soma cabe na altura fixa — o unico modo de falha que essa geometria tem e
 * um card cuja soma de slots passa da altura, e ai o conteudo vaza.
 */
export const SLOT = {
  titleLine: TITLE_LINE_HEIGHT_PX,
  titleMargin: 4,
  bodyLine: BODY_LINE_HEIGHT_PX,
  meta: META_SLOT_HEIGHT,
  metaMargin: 8,
  footer: FOOTER_SLOT_HEIGHT,
  footerMargin: 8,
  // Botao `size="small"` do MUI: 13px * 1.75 de line-height + 8px de padding.
  smallButton: 30.75,
  spacerMin: 8,
  media: CARD_MEDIA_HEIGHT,
  // CardContent: 16px em cima e, via `cardContentSx`, 16px embaixo.
  contentPadding: 32
}

/**
 * Orcamentos de corte, em caracteres. Dimensionados para a largura real da
 * caixa de texto do card: com `Container maxWidth="lg"` e a grade de ate 4
 * colunas, ela fica entre ~232px e ~296px em todos os breakpoints — variacao
 * pequena o bastante para um orcamento unico servir.
 *
 * A linha da lista de noticias e a excecao: vai de ~296px no celular a ~1104px
 * no desktop, entao tem orcamento por breakpoint.
 */
export const TRUNCATE = {
  title: 46,
  body4Lines: 130,
  body3Lines: 100,
  body2Lines: 68,
  metaLine: 30,
  newsRow: { xs: 130, sm: 300 },
  newsRowTitle: { xs: 46, sm: 100 }
}

export function cardRootSx(height) {
  return {
    height,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  }
}

export const cardActionAreaSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0
}

export const cardContentSx = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  // O MUI aplica 24px de padding-bottom no :last-child do CardContent, o que
  // desalinharia o rodape ancorado em relacao ao topo.
  '&:last-child': { pb: 2 }
}

export const cardMediaSlotSx = {
  height: CARD_MEDIA_HEIGHT,
  flexShrink: 0,
  position: 'relative',
  overflow: 'hidden',
  bgcolor: 'action.hover'
}

/**
 * Linha de chips do card. Fica travada em uma linha (`nowrap`): dois chips num
 * card de grade estreito quebrariam para uma segunda linha e estourariam a
 * altura fixa. Quando falta largura, o proprio Chip do MUI corta o rotulo com
 * reticencias em vez de empurrar o layout.
 */
export const cardMetaSlotSx = {
  height: META_SLOT_HEIGHT,
  mb: 1,
  flexShrink: 0,
  flexWrap: 'nowrap',
  overflow: 'hidden',
  '& .MuiChip-root': { minWidth: 0 }
}

function clampLines(lines, lineHeightPx) {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // `break-word` so age quando a palavra sozinha nao cabe na linha — evita
    // que uma URL sem espacos vaze para fora do card. Nao usar `anywhere`, que
    // partiria palavra normal ao meio.
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    hyphens: 'none',
    lineHeight: `${lineHeightPx}px`,
    minHeight: lines * lineHeightPx,
    flexShrink: 0
  }
}

export function cardTitleSx(lines = 2) {
  return {
    ...clampLines(lines, TITLE_LINE_HEIGHT_PX),
    mb: 0.5
  }
}

export function cardBodySx(lines) {
  return clampLines(lines, BODY_LINE_HEIGHT_PX)
}

/** Linha unica de metadado (data, local): reserva uma linha e nao quebra. */
export const cardMetaLineSx = {
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  lineHeight: `${BODY_LINE_HEIGHT_PX}px`
}

/** Absorve a folga entre o corpo e o rodape ancorado. */
export const cardSpacerSx = { flexGrow: 1, minHeight: 8 }

export const cardFooterSlotSx = {
  minHeight: FOOTER_SLOT_HEIGHT,
  mt: 1,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center'
}

/** Alturas de esqueleto, para o carregamento nao provocar salto de layout. */
export const SKELETON_HEIGHT = {
  withMedia: CARD_HEIGHT_WITH_MEDIA,
  textOnly: CARD_HEIGHT_TEXT_ONLY,
  newsRow: NEWS_ROW_HEIGHT.sm
}
