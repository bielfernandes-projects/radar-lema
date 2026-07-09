import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { supabase } from '../lib/supabase'
import { formatDateRange, formatPrice } from '../utils/formatters'

export default function ManageEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null })

  const fetchEvents = async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*, categories(name), event_sessions(start_date, end_date)')
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
    }

    setDeleteDialog({ open: false, event: null })
  }

  const getEventDates = (event) => {
    const dates = event.event_sessions?.map((s) => s.start_date).filter(Boolean).sort()
    if (!dates?.length) return 'Sem datas'
    const ends = event.event_sessions?.map((s) => s.end_date).filter(Boolean).sort()
    return formatDateRange(dates[0], ends[ends.length - 1])
  }

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
          Gestao de eventos
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

      {events.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Nenhum evento cadastrado.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {events.map((event) => (
            <Card key={event.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Typography variant="h6">{event.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.categories?.name} • {getEventDates(event)}
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
            acao nao pode ser desfeita.
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
    </Container>
  )
}
