import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import { supabase } from '../lib/supabase'
import { formatDateRange, formatPrice } from '../utils/formatters'

export default function ManageEvents() {
  const navigate = useNavigate()
  const location = useLocation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null })
  const [tab, setTab] = useState('confirmed')
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

  const confirmedEvents = events.filter((e) => e.is_confirmed !== false)
  const tentativeEvents = events.filter((e) => e.is_confirmed === false)
  const visibleEvents = tab === 'tentative' ? tentativeEvents : confirmedEvents

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
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
          startIcon={<AddIcon />}
          onClick={() => navigate('/gestao/novo')}
        >
          Novo evento
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

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
      </Tabs>

      {visibleEvents.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {tab === 'tentative'
            ? 'Nenhum evento a definir.'
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
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {getEventCategories(event)} • {getEventDates(event)}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {formatPrice(event)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => navigate(`/gestao/${event.id}/editar`)}
                      aria-label="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        navigate(`/gestao/${event.id}/editar?modo=duplicar`)
                      }
                      aria-label="Duplicar"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setDeleteDialog({ open: true, event })
                      }
                      color="error"
                      aria-label="Excluir"
                    >
                      <DeleteIcon />
                    </IconButton>
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
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  )
}
