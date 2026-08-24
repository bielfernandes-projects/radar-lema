import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { formatHubDate, unoUpdateTypeLabel } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_UNO_UPDATE,
  TRUNCATE,
  cardActionAreaSx,
  cardBodySx,
  cardContentSx,
  cardMetaStackSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'

export default function UnoUpdateCard({ update }) {
  const navigate = useNavigate()

  return (
    <Card sx={cardRootSx(CARD_HEIGHT_UNO_UPDATE)}>
      <CardActionArea onClick={() => navigate(`/novidade/${update.id}`)} sx={cardActionAreaSx}>
        <CardContent sx={cardContentSx}>
          {/* Empilhados: lado a lado, a data era cortada pela borda do card. */}
          <Stack direction="column" spacing={0.5} sx={cardMetaStackSx}>
            <Chip label={unoUpdateTypeLabel(update.type)} size="small" color="primary" />
            <Chip label={formatHubDate(update.created_at)} size="small" variant="outlined" />
          </Stack>

          <Typography variant="h6" component="h2" sx={cardTitleSx()}>
            {truncateAtWord(update.title, TRUNCATE.title)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={cardBodySx(4)}>
            {truncateAtWord(update.body, TRUNCATE.body4Lines)}
          </Typography>

          <Box sx={cardSpacerSx} />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
