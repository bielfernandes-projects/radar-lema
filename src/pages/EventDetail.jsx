import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isStaffTier } from '../utils/auth'
import { useFavorites } from '../hooks/useFavorites'
import { useReminders } from '../hooks/useReminders'
import ReminderDialog from '../components/ReminderDialog'
import PageSkeleton from '../components/PageSkeleton'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  MobileStepper,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
  Heart,
  Share2,
  Pencil,
  CalendarDays,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { safeUrl } from '../utils/safeUrl'
import MapEmbed from '../components/MapEmbed'
import Interactions from '../components/Interactions'
import {
  formatDateRange,
  formatModality,
  formatPrice,
  formatSessionTime
} from '../utils/formatters'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const { hasRemindersForEvent, refresh: refreshReminders } = useReminders()
  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [sessions, setSessions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePhoto, setActivePhoto] = useState(0)
  const [toast, setToast] = useState('')
  const [reminderOpen, setReminderOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

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
        setError('Evento não encontrado.')
        setLoading(false)
        return
      }

      const [{ data: photosData }, { data: sessionsData }, { data: categoriesData }, { data: pastEvents }, { data: ongoingEvents }] =
        await Promise.all([
          supabase.from('event_photos').select('*').eq('event_id', id).order('sort_order', { ascending: true }),
          supabase.from('event_sessions').select('*').eq('event_id', id).order('start_date', { ascending: true }),
          supabase.from('event_categories').select('categories(id, name)').eq('event_id', id),
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
      setCategories((categoriesData || []).map((c) => c.categories).filter(Boolean))
      setActivePhoto(0)
      setLoading(false)
    }

    fetchEvent()
  }, [id])

  useEffect(() => {
    if (photos.length < 2) return
    const indices = [activePhoto - 1, activePhoto + 1].filter(
      (i) => i >= 0 && i < photos.length
    )
    indices.forEach((i) => {
      const img = new Image()
      img.src = photos[i].public_url
    })
  }, [activePhoto, photos])

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
        setToast('Link copiado para a área de transferência')
        setTimeout(() => setToast(''), 3000)
      } catch {
        setToast('Não foi possível copiar o link')
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
      <Container maxWidth="md" sx={{ pt: 0, pb: 2 }}>
        <PageSkeleton />
      </Container>
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
    <Container maxWidth="md" sx={{ pt: 0, pb: 2 }}>
      {toast && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {toast}
        </Alert>
      )}

      {event.is_confirmed === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Este evento está a definir e não é visível para clientes.
        </Alert>
      )}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Tooltip title="Voltar">
          <IconButton onClick={() => window.history.back()} aria-label="Voltar">
            <ArrowLeft />
          </IconButton>
        </Tooltip>

        <Stack direction="row" spacing={0.5}>
          {isStaffTier(profile) && (
            <Tooltip title="Editar evento">
              <IconButton
                onClick={() => navigate(`/gestao/${id}/editar`)}
                aria-label="Editar evento"
                color="primary"
              >
                <Pencil size={22} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={favoriteIds.has(id) ? 'Remover dos favoritos' : 'Favoritar'}>
            <IconButton
              onClick={async () => {
                const result = await toggleFavorite(id)
                if (result?.error) {
                  setToast('Erro ao atualizar favorito.')
                } else {
                  if (result?.favorited && !hasRemindersForEvent(id)) {
                    setReminderOpen(true)
                  }
                  setToast(
                    result?.favorited
                      ? 'Adicionado aos favoritos'
                      : 'Removido dos favoritos'
                  )
                }
              }}
              aria-label={favoriteIds.has(id) ? 'Remover dos favoritos' : 'Favoritar'}
              sx={{ color: favoriteIds.has(id) ? 'favorite.main' : 'inherit' }}
            >
              {favoriteIds.has(id) ? (
                <Heart size={22} fill="currentColor" />
              ) : (
                <Heart size={22} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Compartilhar evento">
            <IconButton onClick={handleShare} aria-label="Compartilhar">
              <Share2 size={22} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden', bgcolor: 'grey.200' }}>
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={photos[activePhoto]?.public_url || '/placeholder-event.png?v=2'}
            alt={event.title}
            loading="lazy"
            onClick={() => setLightboxOpen(true)}
            tabIndex={0}
            role="button"
            aria-label="Ampliar foto do evento"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setLightboxOpen(true)
              }
            }}
            sx={{ width: '100%', height: { xs: 240, md: 360 }, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
          />
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
                Próxima
                <ChevronRight size={20} />
              </Button>
            }
            backButton={
              <Button
                size="small"
                onClick={() => setActivePhoto((prev) => prev - 1)}
                disabled={activePhoto === 0}
              >
                <ChevronLeft size={20} />
                Anterior
              </Button>
            }
          />
        )}
      </Paper>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {event.is_lema_edu && <Chip label="Lema Edu" color="primary" size="small" />}
        {event.is_past && <Chip label="Realizado" color="default" size="small" />}
        {event.is_ongoing && <Chip label="Em andamento" color="secondary" size="small" />}
        {categories.map((c) => (
          <Chip key={c.id} label={c.name} color="primary" size="small" />
        ))}
      </Stack>

      <Typography variant="h4" component="h1" gutterBottom>
        {event.title}
      </Typography>

      <Stack spacing={1} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
          <CalendarDays size={20} />
          <Typography variant="body1" color="text.secondary">
            {formatDateRange(
              sessions[0]?.start_date,
              sessions[sessions.length - 1]?.end_date
            )}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
          <MapPin size={20} />
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
        href={safeUrl(event.url) ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<ExternalLink size={20} />}
        sx={{ mb: 3 }}
      >
        Inscrever-se
      </Button>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Sessões
      </Typography>

      {sessions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhuma sessão cadastrada.
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

      <ReminderDialog
        open={reminderOpen}
        event={event}
        onClose={() => setReminderOpen(false)}
        onSaved={() => refreshReminders()}
      />

      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.9)',
            position: 'relative'
          }
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Tooltip title="Fechar">
            <IconButton
              onClick={() => setLightboxOpen(false)}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 2,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.4)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
              }}
              aria-label="Fechar"
            >
              <X size={24} />
            </IconButton>
          </Tooltip>

          <Box
            component="img"
            src={photos[activePhoto]?.public_url || '/placeholder-event.png?v=2'}
            alt={event.title}
            tabIndex={0}
            role="button"
            aria-label="Fechar visualização ampliada"
            onClick={() => setLightboxOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setLightboxOpen(false)
              }
            }}
            sx={{
              maxWidth: '100%',
              maxHeight: '100vh',
              objectFit: 'contain',
              cursor: 'zoom-out',
              display: 'block'
            }}
          />
        </DialogContent>

        {photos.length > 1 && (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <Button
              variant="contained"
              onClick={() => setActivePhoto((prev) => Math.max(0, prev - 1))}
              disabled={activePhoto === 0}
            >
              Anterior
            </Button>
            <Button
              variant="contained"
              onClick={() => setActivePhoto((prev) => Math.min(photos.length - 1, prev + 1))}
              disabled={activePhoto === photos.length - 1}
            >
              Próxima
            </Button>
          </Stack>
        )}
      </Dialog>

      <Interactions contentType="event" contentId={event.id} />
    </Container>
  )
}
