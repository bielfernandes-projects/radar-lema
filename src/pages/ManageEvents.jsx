import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Plus, Pencil, Copy, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateRange, formatPrice } from '../utils/formatters'
import PageSkeleton from '../components/PageSkeleton'

export default function ManageEvents() {
  const navigate = useNavigate()
  const location = useLocation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null })
  const [tab, setTab] = useState('confirmed')
  const [query, setQuery] = useState('')
  const [pastIds, setPastIds] = useState(new Set())
  const [successMessage, setSuccessMessage] = useState(
    location.state?.saved ? 'Evento salvo com sucesso.' : ''
  )
  const [deleteSnackbar, setDeleteSnackbar] = useState(false)

  useEffect(() => {
    if (location.state?.saved) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000)
      window.history.replaceState({}, '')
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const fetchEvents = async () => {
    setLoading(true)
    setError('')

    const { data: pastRows, error: pastError } = await supabase
      .from('v_past_events')
      .select('id')

    if (!pastError) {
      setPastIds(new Set((pastRows || []).map((e) => e.id)))
    }

    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*, event_categories(categories(name)), event_sessions(start_date, end_date)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Erro ao carregar eventos.')
    } else {
      setEvents(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async () => {
    const event = deleteDialog.event
    if (!event) return

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id)

    if (deleteError) {
      setError('Erro ao excluir evento.')
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      setDeleteSnackbar(true)
    }

    setDeleteDialog({ open: false, event: null })
  }

  const getEventCategories = (event) => {
    const names =
      event.event_categories?.map((c) => c.categories?.name).filter(Boolean) || []
    return names.join(', ')
  }

  const getEventDates = (event) => {
    const dates = event.event_sessions?.map((s) => s.start_date).filter(Boolean).sort()
    if (!dates?.length) return 'Sem datas'
    const ends = event.event_sessions?.map((s) => s.end_date).filter(Boolean).sort()
    return formatDateRange(dates[0], ends[ends.length - 1])
  }

  const searchTerm = query.trim().toLowerCase()
  const filteredEvents = searchTerm
    ? events.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchTerm) ||
          e.description?.toLowerCase().includes(searchTerm)
      )
    : events

  const realizedEvents = filteredEvents.filter((e) => pastIds.has(e.id))
  const confirmedEvents = filteredEvents.filter(
    (e) => e.is_confirmed !== false && !pastIds.has(e.id)
  )
  const tentativeEvents = filteredEvents.filter(
    (e) => e.is_confirmed === false && !pastIds.has(e.id)
  )
  const visibleEvents =
    tab === 'tentative'
      ? tentativeEvents
      : tab === 'realized'
        ? realizedEvents
        : confirmedEvents

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Gestão de eventos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/gestao/novo')}
        >
          Novo evento
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="inherit" onClick={fetchEvents}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <TextField
        label="Buscar eventos"
        placeholder="Título ou descrição"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Confirmados" value="confirmed" />
        <Tab
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>A definir</span>
              {tentativeEvents.length > 0 && (
                <Chip
                  label={tentativeEvents.length}
                  size="small"
                  color="warning"
                  sx={{ height: 20, minWidth: 20 }}
                />
              )}
            </Stack>
          }
          value="tentative"
        />
        <Tab
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Realizados</span>
              {realizedEvents.length > 0 && (
                <Chip
                  label={realizedEvents.length}
                  size="small"
                  color="default"
                  sx={{ height: 20, minWidth: 20 }}
                />
              )}
            </Stack>
          }
          value="realized"
        />
      </Tabs>

      {visibleEvents.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {searchTerm
            ? 'Nenhum evento encontrado.'
            : tab === 'tentative'
              ? 'Nenhum evento a definir.'
              : tab === 'realized'
                ? 'Nenhum evento realizado.'
                : 'Nenhum evento cadastrado.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {visibleEvents.map((event) => (
            <Card key={event.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">{event.title}</Typography>
                      {event.is_confirmed === false && (
                        <Chip label="A definir" size="small" color="warning" />
                      )}
                      {pastIds.has(event.id) && (
                        <Chip label="Realizado" size="small" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {getEventCategories(event)} • {getEventDates(event)}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {formatPrice(event)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Editar evento">
                      <IconButton
                        onClick={() => navigate(`/gestao/${event.id}/editar`)}
                        aria-label="Editar"
                      >
                        <Pencil size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicar evento">
                      <IconButton
                        onClick={() =>
                          navigate(`/gestao/${event.id}/editar?modo=duplicar`)
                        }
                        aria-label="Duplicar"
                      >
                        <Copy size={20} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir evento">
                      <IconButton
                        onClick={() =>
                          setDeleteDialog({ open: true, event })
                        }
                        color="error"
                        aria-label="Excluir"
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, event: null })}
      >
        <DialogTitle>Excluir evento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir {deleteDialog.event?.title}? Esta
            ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, event: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={deleteSnackbar}
        autoHideDuration={3000}
        onClose={() => setDeleteSnackbar(false)}
        message="Evento excluído com sucesso."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <IconButton
            size="small"
            color="inherit"
            aria-label="Fechar"
            onClick={() => setDeleteSnackbar(false)}
          >
            <X size={18} />
          </IconButton>
        }
      />
    </Container>
  )
}
