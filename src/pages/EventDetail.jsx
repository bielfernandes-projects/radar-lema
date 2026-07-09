import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  MobileStepper,
  Paper,
  Stack,
  Typography,
  CircularProgress
} from '@mui/material'
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Favorite from '@mui/icons-material/Favorite'
import Share from '@mui/icons-material/Share'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import PlaceIcon from '@mui/icons-material/Place'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { supabase } from '../lib/supabase'
import MapEmbed from '../components/MapEmbed'
import {
  formatDateRange,
  formatModality,
  formatPrice,
  formatSessionTime
} from '../utils/formatters'

export default function EventDetail() {
  const { id } = useParams()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [sessions, setSessions] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePhoto, setActivePhoto] = useState(0)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      setError('')

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (eventError || !eventData) {
        setError('Evento nao encontrado.')
        setLoading(false)
        return
      }

      const [{ data: photosData }, { data: sessionsData }, { data: categoryData }, { data: pastEvents }, { data: ongoingEvents }] =
        await Promise.all([
          supabase.from('event_photos').select('*').eq('event_id', id).order('sort_order', { ascending: true }),
          supabase.from('event_sessions').select('*').eq('event_id', id).order('start_date', { ascending: true }),
          eventData.category_id
            ? supabase.from('categories').select('*').eq('id', eventData.category_id).single()
            : Promise.resolve({ data: null }),
          supabase.from('v_past_events').select('id').eq('id', id).single(),
          supabase.from('v_ongoing_events').select('id').eq('id', id).single()
        ])

      setEvent({
        ...eventData,
        is_past: !!pastEvents,
        is_ongoing: !!ongoingEvents
      })
      setPhotos(photosData || [])
      setSessions(sessionsData || [])
      setCategory(categoryData)
      setActivePhoto(0)
      setLoading(false)
    }

    fetchEvent()
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url
        })
      } catch {
        // usuario cancelou
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copiado para a area de transferencia')
        setTimeout(() => setToast(''), 3000)
      } catch {
        setToast('Nao foi possivel copiar o link')
      }
    }
  }

  const locationLabel =
    event?.modality === 'online'
      ? 'Online'
      : [event?.city, event?.state].filter(Boolean).join(' - ')

  const showMap = event?.modality === 'presencial' || event?.modality === 'hibrido'

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {toast && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {toast}
        </Alert>
      )}

      <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={photos[activePhoto]?.public_url || '/placeholder-event.png'}
            alt={event.title}
            sx={{ width: '100%', height: { xs: 240, md: 360 }, objectFit: 'cover' }}
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 12, left: 12 }}
          >
            {event.is_past && <Chip label="Realizado" color="default" />}
            {event.is_ongoing && <Chip label="Em andamento" color="secondary" />}
            {category && <Chip label={category.name} color="primary" />}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            <IconButton
              onClick={async () => {
                const result = await toggleFavorite(id)
                if (result?.error) {
                  setToast('Erro ao atualizar favorito.')
                } else {
                  setToast(
                    result?.favorited
                      ? 'Adicionado aos favoritos'
                      : 'Removido dos favoritos'
                  )
                }
              }}
              sx={{ bgcolor: 'background.paper' }}
              aria-label="Favoritar"
            >
              {favoriteIds.has(id) ? (
                <Favorite color="error" />
              ) : (
                <FavoriteBorder />
              )}
            </IconButton>
            <IconButton
              onClick={handleShare}
              sx={{ bgcolor: 'background.paper' }}
              aria-label="Compartilhar"
            >
              <Share />
            </IconButton>
          </Stack>
        </Box>

        {photos.length > 1 && (
          <MobileStepper
            variant="dots"
            steps={photos.length}
            position="static"
            activeStep={activePhoto}
            nextButton={
              <Button
                size="small"
                onClick={() => setActivePhoto((prev) => prev + 1)}
                disabled={activePhoto === photos.length - 1}
              >
                Proxima
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button
                size="small"
                onClick={() => setActivePhoto((prev) => prev - 1)}
                disabled={activePhoto === 0}
              >
                <KeyboardArrowLeft />
                Anterior
              </Button>
            }
          />
        )}
      </Paper>

      <Typography variant="h4" component="h1" gutterBottom>
        {event.title}
      </Typography>

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalendarMonthIcon color="action" />
          <Typography variant="body1" color="text.secondary">
            {formatDateRange(
              sessions[0]?.start_date,
              sessions[sessions.length - 1]?.end_date
            )}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <PlaceIcon color="action" />
          <Typography variant="body1" color="text.secondary">
            {locationLabel || formatModality(event.modality)}
          </Typography>
        </Stack>

        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
          {formatPrice(event)}
        </Typography>
      </Stack>

      <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
        {event.description}
      </Typography>

      <Button
        variant="contained"
        size="large"
        fullWidth
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewIcon />}
        sx={{ mb: 3 }}
      >
        Inscrever-se
      </Button>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Sessoes
      </Typography>

      {sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhuma sessao cadastrada.
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ mb: 3 }}>
          {sessions.map((session) => (
            <Typography key={session.id} variant="body1">
              {formatSessionTime(
                session.start_date,
                session.start_time,
                session.end_date,
                session.end_time
              )}
            </Typography>
          ))}
        </Stack>
      )}

      {showMap && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h5" component="h2" gutterBottom>
            Mapa
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {event.address}
          </Typography>
          <MapEmbed address={event.address} />
        </>
      )}
    </Container>
  )
}
