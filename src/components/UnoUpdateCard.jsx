import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { formatHubDate, unoUpdateTypeLabel } from '../utils/hub'

export default function UnoUpdateCard({ update }) {
  const navigate = useNavigate()

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={() => navigate(`/novidade/${update.id}`)}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip label={unoUpdateTypeLabel(update.type)} size="small" color="primary" />
            <Chip label={formatHubDate(update.created_at)} size="small" variant="outlined" />
          </Stack>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            {update.title}
          </Typography>
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
            {update.body}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
