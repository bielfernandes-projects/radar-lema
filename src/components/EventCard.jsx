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
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/evento/${event.id}`)}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ bgcolor: 'grey.200', height: 180 }}>
            <CardMedia
              component="img"
              height="180"
              image={event.cover_photo?.public_url || '/placeholder-event.png?v=2'}
              alt={event.title}
              loading="lazy"
              sx={{ objectFit: 'cover' }}
            />
          </Box>
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

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {event.title}
          </Typography>

          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
              <CalendarDays size={18} />
              <Typography variant="body2" color="text.secondary">
                {formatDateRange(event.min_date, event.max_date)}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
              <MapPin size={18} />
              <Typography variant="body2" color="text.secondary">
                {locationLabel || formatModality(event.modality)}
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="body1"
            sx={{ mt: 2, fontWeight: 600, color: 'primary.main' }}
          >
            {formatPrice(event)}
          </Typography>
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
