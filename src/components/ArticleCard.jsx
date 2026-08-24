import { useState } from 'react'
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material'
import { BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_WITH_MEDIA,
  CARD_MEDIA_HEIGHT,
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

export default function ArticleCard({ article }) {
  const navigate = useNavigate()
  const [imgFailed, setImgFailed] = useState(false)

  const hasCover = Boolean(article.cover_url) && !imgFailed

  return (
    <Card sx={cardRootSx(CARD_HEIGHT_WITH_MEDIA)}>
      <CardActionArea onClick={() => navigate(`/artigo/${article.id}`)} sx={cardActionAreaSx}>
        {/* O slot da capa e sempre renderizado: artigo sem capa cai no
            placeholder em vez de encolher o card. */}
        <Box sx={cardMediaSlotSx}>
          {hasCover ? (
            <CardMedia
              component="img"
              height={CARD_MEDIA_HEIGHT}
              image={article.cover_url}
              alt={article.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Stack
              sx={{
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled'
              }}
            >
              <BookOpen size={40} />
            </Stack>
          )}
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
