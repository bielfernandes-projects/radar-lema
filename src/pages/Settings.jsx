import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Autocomplete,
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
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { supabase } from '../lib/supabase'
import { useReminders } from '../hooks/useReminders'
import { useNotificationSettings } from '../hooks/useNotificationSettings'
import ReminderDialog from '../components/ReminderDialog'
import { formatReminderMinutes, minutesToReminder } from '../utils/formatters'

export default function Settings() {
  const navigate = useNavigate()
  const {
    remindersByEvent,
    removeReminders,
    refresh: refreshReminders,
    loading: remindersLoading
  } = useReminders()
  const {
    settings,
    saveSettings,
    loading: settingsLoading
  } = useNotificationSettings()
  const [categories, setCategories] = useState([])
  const [eventsMap, setEventsMap] = useState({})
  const [testResult, setTestResult] = useState('')
  const [editReminder, setEditReminder] = useState(null)
  const [removeDialog, setRemoveDialog] = useState({ open: false, eventId: null, eventTitle: '' })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error) setCategories(data || [])
      })
  }, [])

  useEffect(() => {
    if (settings && categories.length > 0) {
      setPushEnabled(settings.push_enabled)
      setEmailEnabled(settings.email_enabled)
      setSelectedCategories(
        settings.categories_enabled?.includes('*')
          ? ['Todas']
          : settings.categories_enabled || []
      )
    }
  }, [settings, categories])

  useEffect(() => {
    const eventIds = Array.from(remindersByEvent.keys())
    if (eventIds.length === 0) {
      setEventsMap({})
      return
    }

    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds)

      if (data) {
        const map = {}
        data.forEach((e) => {
          map[e.id] = e
        })
        setEventsMap(map)
      }
    }

    fetchEvents()
  }, [remindersByEvent])

  const handlePushToggle = async (value) => {
    setPushEnabled(value)
    await saveSettings({ push_enabled: value })
  }

  const handleEmailToggle = async (value) => {
    setEmailEnabled(value)
    await saveSettings({ email_enabled: value })
  }

  const handleCategoriesChange = async (value) => {
    if (value.includes('Todas')) {
      setSelectedCategories(['Todas'])
      await saveSettings({ categories_enabled: ['*'] })
    } else {
      setSelectedCategories(value)
      await saveSettings({ categories_enabled: value })
    }
  }

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setTestResult('Seu navegador não suporta notificações.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('Radar Lema', {
        body: 'Assim apareceriam seus lembretes antes dos eventos.',
        icon: '/icons/icon-192x192.png'
      })
      setTestResult('')
    } else if (permission === 'denied') {
      setTestResult(
        'Permissão negada. Ative nas configurações do navegador.'
      )
    } else {
      setTestResult('Permissão não concedida.')
    }
  }

  const handleRemoveAll = async (eventId) => {
    await removeReminders(eventId)
    await refreshReminders()
    setRemoveDialog({ open: false, eventId: null, eventTitle: '' })
  }

  const openRemoveDialog = (eventId, eventTitle) => {
    setRemoveDialog({ open: true, eventId, eventTitle })
  }

  const reminderEntries = useMemo(() => {
    return Array.from(remindersByEvent.entries()).map(([eventId, entries]) => ({
      eventId,
      entries: entries
        .slice()
        .sort((a, b) => b.offset_minutes - a.offset_minutes),
      event: eventsMap[eventId]
    }))
  }, [remindersByEvent, eventsMap])

  if (settingsLoading || remindersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações de Notificações
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notificações push
          </Typography>
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography>Receber notificacoes push</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ative para receber avisos antes dos eventos favoritos.
                </Typography>
              </Box>
              <Switch
                checked={pushEnabled}
                onChange={(e) => handlePushToggle(e.target.checked)}
              />
            </Stack>

            <Box
              sx={{
                opacity: pushEnabled ? 1 : 0.4,
                pointerEvents: pushEnabled ? 'auto' : 'none',
                transition: 'opacity 0.2s'
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography>Notificar novos eventos</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receba avisos sobre novos eventos das categorias
                      selecionadas.
                    </Typography>
                  </Box>
                  <Switch
                    checked={emailEnabled}
                    onChange={(e) => handleEmailToggle(e.target.checked)}
                  />
                </Stack>

                <Autocomplete
                  multiple
                  disabled={!emailEnabled}
                  options={['Todas', ...categories.map((c) => c.name)]}
                  value={selectedCategories}
                  onChange={(e, newValue) => handleCategoriesChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Quais categorias notificar"
                      helperText="Selecione 'Todas' para receber de todas as categorias."
                      inputProps={{ ...params.inputProps, readOnly: true }}
                    />
                  )}
                />

                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleTestNotification}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Testar notificação
                </Button>
                {testResult && (
                  <Alert severity="warning">{testResult}</Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Meus lembretes
          </Typography>

          {reminderEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Você ainda não configurou lembretes. Favorite um evento para ser
              avisado antes.
            </Typography>
          ) : (
            <List disablePadding>
              {reminderEntries.map(({ eventId, entries, event }) => (
                <ListItem
                  key={eventId}
                  sx={{
                    px: 0,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5
                  }}
                  disableGutters
                >
                  <ListItemText
                    sx={{ flex: '1 1 100%', mb: 1 }}
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                          fontWeight: 500
                        }}
                        onClick={() => navigate(`/evento/${eventId}`)}
                      >
                        {event?.title || 'Carregando...'}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                        {entries.map((reminder) => (
                          <Chip
                            key={`${reminder.offset_minutes}-${reminder.channel}`}
                            label={formatReminderMinutes(
                              reminder.offset_minutes,
                              reminder.channel
                            )}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() =>
                        setEditReminder({
                          eventId,
                          entries: entries.map((reminder) => ({
                            ...minutesToReminder(reminder.offset_minutes),
                            channel: reminder.channel
                          })),
                          event
                        })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => openRemoveDialog(eventId, event?.title || 'este evento')}
                    >
                      Remover todos
                    </Button>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={removeDialog.open}
        onClose={() => setRemoveDialog({ open: false, eventId: null, eventTitle: '' })}
      >
        <DialogTitle>Remover todos os lembretes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover todos os lembretes de &quot;
            {removeDialog.eventTitle}&quot;? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialog({ open: false, eventId: null, eventTitle: '' })}>
            Cancelar
          </Button>
          <Button
            onClick={() => handleRemoveAll(removeDialog.eventId)}
            color="error"
            variant="contained"
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      <ReminderDialog
        open={!!editReminder}
        event={editReminder?.event || { id: '', title: '' }}
        initialEntries={editReminder?.entries || []}
        onClose={() => setEditReminder(null)}
        onSaved={() => {
          setEditReminder(null)
          refreshReminders()
        }}
      />
    </Container>
  )
}
