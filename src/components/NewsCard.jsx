import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_TEXT_ONLY,
  NEWS_ROW_HEIGHT,
  TRUNCATE,
  cardActionAreaSx,
  cardBodySx,
  cardContentSx,
  cardMetaSlotSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'

/**
 * Noticia nao tem capa em nenhum layout: o agregador RSS nao entrega thumbnail
 * confiavel, e metade dos cards cairia em placeholder.
 *
 * `card` e usado no carrossel mobile do Feed; `list` na pagina /noticias e no
 * Feed desktop.
 */
export default function NewsCard({ news, layout = 'card' }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isWideRow = useMediaQuery(theme.breakpoints.up('sm'))

  const isList = layout === 'list'

  // A linha da lista e o unico slot que muda muito de largura entre celular e
  // desktop, entao e o unico com orcamento de corte por breakpoint.
  const bodyBudget = isList
    ? isWideRow
      ? TRUNCATE.newsRow.sm
      : TRUNCATE.newsRow.xs
    : TRUNCATE.body4Lines

  const titleBudget = isList
    ? isWideRow
      ? TRUNCATE.newsRowTitle.sm
      : TRUNCATE.newsRowTitle.xs
    : TRUNCATE.title

  const titleLines = isList && isWideRow ? 1 : 2
  const bodyLines = isList ? 2 : 4
  const height = isList
    ? isWideRow
      ? NEWS_ROW_HEIGHT.sm
      : NEWS_ROW_HEIGHT.xs
    : CARD_HEIGHT_TEXT_ONLY

  return (
    <Card sx={cardRootSx(height)}>
      <CardActionArea onClick={() => navigate(`/noticia/${news.id}`)} sx={cardActionAreaSx}>
        <CardContent sx={cardContentSx}>
          <Stack direction="row" spacing={1} sx={cardMetaSlotSx}>
            {news.source && <Chip label={news.source} size="small" variant="outlined" />}
            <Chip label={formatHubDate(news.published_at)} size="small" variant="outlined" />
          </Stack>

          <Typography variant="h6" component="h2" sx={cardTitleSx(titleLines)}>
            {truncateAtWord(news.title, titleBudget)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={cardBodySx(bodyLines)}>
            {truncateAtWord(news.description, bodyBudget)}
          </Typography>

          <Box sx={cardSpacerSx} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
