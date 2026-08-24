import { useState } from 'react'
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  ARTICLE_MEDIA_HEIGHT,
  CARD_HEIGHT_ARTICLE,
  TRUNCATE,
  cardActionAreaSx,
  cardBodySx,
  cardContentSx,
  cardFooterSlotSx,
  cardMediaSlotSx,
  cardMetaSlotSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'
import ExclusiveBadge from './ExclusiveBadge'

/**
 * Capa de reserva. Um card de artigo sem imagem nao se justifica — o slot de
 * capa ficaria vazio acima do titulo. Artigo sem capa propria (ou com capa que
 * falhou ao carregar) cai nesta arte da Lema, no mesmo padrao de
 * `placeholder-event.png` usado pelo card de evento.
 */
const FALLBACK_COVER = '/placeholder-article.png?v=1'

export default function ArticleCard({ article }) {
  const navigate = useNavigate()
  const [imgFailed, setImgFailed] = useState(false)

  const coverUrl = (!imgFailed && article.cover_url) || FALLBACK_COVER

  return (
    <Card sx={cardRootSx(CARD_HEIGHT_ARTICLE)}>
      <CardActionArea onClick={() => navigate(`/artigo/${article.id}`)} sx={cardActionAreaSx}>
        {/* O slot da capa e sempre renderizado com imagem: sem capa propria,
            entra a arte da Lema, e a grade segue simetrica. */}
        <Box sx={cardMediaSlotSx(ARTICLE_MEDIA_HEIGHT)}>
          <CardMedia
            component="img"
            height={ARTICLE_MEDIA_HEIGHT}
            image={coverUrl}
            alt={article.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            sx={{ objectFit: 'cover' }}
          />
        </Box>

        <CardContent sx={cardContentSx}>
          <Stack direction="row" spacing={1} sx={cardMetaSlotSx}>
            {article.origin === 'blog' && <Chip label="Blog Lema" size="small" variant="outlined" />}
            {article.visibility === 'lema_client' && <ExclusiveBadge compact />}
            <Chip label={formatHubDate(article.created_at)} size="small" variant="outlined" />
          </Stack>

          <Typography variant="h6" component="h2" sx={cardTitleSx()}>
            {truncateAtWord(article.title, TRUNCATE.title)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={cardBodySx(2)}>
            {truncateAtWord(article.subtitle, TRUNCATE.body2Lines)}
          </Typography>

          <Box sx={cardSpacerSx} />

          <Box sx={cardFooterSlotSx}>
            {article.author && (
              <Typography variant="caption" color="text.secondary">
                Por {truncateAtWord(article.author, TRUNCATE.metaLine)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
