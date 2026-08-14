import { useState } from 'react'
import { Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from '@mui/material'
import { Newspaper } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatHubDate } from '../utils/hub'

function NewsThumb({ news }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (news.image_url && !imgFailed) {
    return (
      <CardMedia
        component="img"
        image={news.image_url}
        alt={news.title}
        sx={{ height: 160, objectFit: 'cover' }}
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <Stack
      sx={{
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
        color: 'text.disabled'
      }}
    >
      <Newspaper size={40} />
    </Stack>
  )
}

function NewsText({ news }) {
  return (
    <CardContent sx={{ flexGrow: 1 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        {news.source && <Chip label={news.source} size="small" variant="outlined" />}
        <Chip label={formatHubDate(news.published_at)} size="small" variant="outlined" />
      </Stack>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
        {news.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {news.description}
      </Typography>
    </CardContent>
  )
}

export default function NewsCard({ news, layout = 'card' }) {
  const navigate = useNavigate()

  if (layout === 'list') {
    return (
      <Card variant="outlined">
        <CardActionArea onClick={() => navigate(`/noticia/${news.id}`)}>
          <NewsText news={news} />
        </CardActionArea>
      </Card>
    )
  }

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={() => navigate(`/noticia/${news.id}`)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <NewsThumb news={news} />
        <NewsText news={news} />
      </CardActionArea>
    </Card>
  )
}
