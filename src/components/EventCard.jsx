import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  Box
} from '@mui/material'
import { CalendarDays, MapPin, Heart, X } from 'lucide-react'
import {
  formatDateRange,
  formatModality,
  formatPrice
} from '../utils/formatters'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_WITH_MEDIA,
  CARD_MEDIA_HEIGHT,
  TRUNCATE,
  cardActionAreaSx,
  cardContentSx,
  cardFooterSlotSx,
  cardMediaSlotSx,
  cardMetaLineSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'
import { useReminders } from '../hooks/useReminders'
import ReminderDialog from './ReminderDialog'

export default function EventCard({ event, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate()
  const { hasRemindersForEvent, refresh: refreshReminders } = useReminders()
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })
  const [reminderOpen, setReminderOpen] = useState(false)

  const locationLabel =
    event.modality === 'online'
      ? 'Online'
      : [event.city, event.state].filter(Boolean).join(' - ')

  const dateLabel = formatDateRange(event.min_date, event.max_date)
  const placeLabel = locationLabel || formatModality(event.modality)

  const handleFavoriteClick = async (clickEvent) => {
    clickEvent.stopPropagation()
    if (!onToggleFavorite) return

    const result = await onToggleFavorite(event.id)
    if (result?.error) {
      setSnackbar({ open: true, message: 'Erro ao atualizar favorito.' })
      return
    }

    if (result?.favorited && !hasRemindersForEvent(event.id)) {
      setReminderOpen(true)
    }

    setSnackbar({
      open: true,
      message: result?.favorited
        ? 'Adicionado aos favoritos'
        : 'Removido dos favoritos'
    })
  }

  return (
    <Card sx={cardRootSx(CARD_HEIGHT_WITH_MEDIA)}>
      <CardActionArea
        onClick={() => navigate(`/evento/${event.id}`)}
        sx={cardActionAreaSx}
      >
        <Box sx={cardMediaSlotSx}>
          <CardMedia
            component="img"
            height={CARD_MEDIA_HEIGHT}
            image={event.cover_photo?.public_url || '/placeholder-event.png?v=2'}
            alt={event.title}
            loading="lazy"
            sx={{ objectFit: 'cover' }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 8, left: 8 }}
          >
            {event.is_lema_edu && (
              <Chip label="Lema Edu" size="small" color="primary" />
            )}
            {event.is_confirmed === false && (
              <Chip label="A definir" size="small" color="warning" />
            )}
            {event.is_past && <Chip label="Realizado" size="small" color="default" />}
            {event.is_ongoing && (
              <Chip label="Em andamento" size="small" color="secondary" />
            )}
          </Stack>
        </Box>

        <CardContent sx={cardContentSx}>
          <Typography variant="h6" component="h2" sx={cardTitleSx()}>
            {truncateAtWord(event.title, TRUNCATE.title)}
          </Typography>

          <Stack spacing={0.5} sx={{ flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', minWidth: 0 }}>
              <CalendarDays size={18} style={{ flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" sx={cardMetaLineSx}>
                {truncateAtWord(dateLabel, TRUNCATE.metaLine)}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', minWidth: 0 }}>
              <MapPin size={18} style={{ flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary" sx={cardMetaLineSx}>
                {truncateAtWord(placeLabel, TRUNCATE.metaLine)}
              </Typography>
            </Stack>
          </Stack>

          <Box sx={cardSpacerSx} />

          <Box sx={cardFooterSlotSx}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {formatPrice(event)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>

      <Tooltip title={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}>
        <IconButton
          onClick={handleFavoriteClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper' },
            color: isFavorite ? 'favorite.main' : 'inherit'
          }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          {isFavorite ? <Heart size={22} fill="currentColor" /> : <Heart size={22} />}
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            color="inherit"
            aria-label="Fechar"
            onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            <X size={18} />
          </IconButton>
        }
      />

      <ReminderDialog
        open={reminderOpen}
        event={event}
        onClose={() => setReminderOpen(false)}
        onSaved={() => refreshReminders()}
      />
    </Card>
  )
}
