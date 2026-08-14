import { useState } from 'react'
import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import { BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatHubDate } from '../utils/hub'
import ExclusiveBadge from './ExclusiveBadge'

export default function ArticleCard({ article }) {
  const navigate = useNavigate()
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(`/artigo/${article.id}`)}>
        <CardContent>
          {article.cover_url && !imgFailed && (
            <img
              src={article.cover_url}
              alt={article.title}
              onError={() => setImgFailed(true)}
              style={{
                width: '100%',
                height: 160,
                objectFit: 'cover',
                borderRadius: 8,
                marginBottom: 12
              }}
            />
          )}
          {article.cover_url && imgFailed && (
            <Stack
              sx={{
                height: 160,
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                color: 'text.disabled',
                borderRadius: 1,
                mb: 1.5
              }}
            >
              <BookOpen size={40} />
            </Stack>
          )}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            {article.visibility === 'lema_client' && <ExclusiveBadge />}
            <Chip label={formatHubDate(article.created_at)} size="small" variant="outlined" />
          </Stack>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            {article.title}
          </Typography>
          {article.subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {article.subtitle}
            </Typography>
          )}
          {article.author && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Por {article.author}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
