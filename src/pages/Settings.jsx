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
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useReminders } from '../hooks/useReminders'
import {
  useNotificationSettings,
  topicChannel
} from '../hooks/useNotificationSettings'
import ReminderDialog from '../components/ReminderDialog'
import InstallAppButton from '../components/InstallAppButton'
import PasswordToggle from '../components/PasswordToggle'
import PageSkeleton from '../components/PageSkeleton'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useAuth } from '../contexts/AuthContext'
import { validatePassword } from '../utils/auth'
import { formatReminderMinutes, minutesToReminder } from '../utils/formatters'

// Linhas fixas da matriz de notificações (tópicos não-evento). Eventos é uma
// linha à parte, com seleção de categorias.
const NOTIFICATION_ROWS = [
  { key: 'news', label: 'Notícias de Mercado' },
  { key: 'articles', label: 'Artigos' },
  { key: 'materials', label: 'Materiais de apoio' },
  { key: 'uno_updates', label: 'Novidades UNO' }
]

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
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
  const [tab, setTab] = useState('perfil')
  const [categories, setCategories] = useState([])
  const [eventsMap, setEventsMap] = useState({})
  const [testResult, setTestResult] = useState('')
  const [editReminder, setEditReminder] = useState(null)
  const [removeDialog, setRemoveDialog] = useState({ open: false, eventId: null, eventTitle: '' })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [newEventsEnabled, setNewEventsEnabled] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const { enable: enablePush, disable: disablePush } = usePushNotifications()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameMessage, setNameMessage] = useState('')
  const [nameError, setNameError] = useState('')

  // categories_enabled é persistido como IDs de categoria ('*' = todas). O
  // Autocomplete exibe nomes; traduzimos na fronteira de persistência.
  const catName = (id) => categories.find((c) => c.id === id)?.name || id
  const catId = (name) => categories.find((c) => c.name === name)?.id || name

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
    setDisplayName(profile?.name || '')
  }, [profile])

  useEffect(() => {
    if (settings && categories.length > 0) {
      setPushEnabled(settings.push_enabled)
      const enabled = settings.categories_enabled || []
      setNewEventsEnabled(enabled.length > 0)
      setSelectedCategories(
        enabled.includes('*') ? ['Todas'] : enabled.map(catName)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (value) {
      try {
        await enablePush()
        await saveSettings({ push_enabled: true })
        setPushEnabled(true)
      } catch (e) {
        setTestResult(e?.message || 'Não foi possível ativar as notificações.')
      }
    } else {
      await disablePush()
      await saveSettings({ push_enabled: false })
      setPushEnabled(false)
    }
  }

  // Liga o switch mestre de push (permissão + subscription) se ainda estiver
  // desligado. Usado antes de ativar qualquer linha da matriz.
  const ensurePushMaster = async () => {
    if (pushEnabled) return true
    try {
      await enablePush()
      await saveSettings({ push_enabled: true })
      setPushEnabled(true)
      return true
    } catch (e) {
      setTestResult(e?.message || 'Não foi possível ativar as notificações.')
      return false
    }
  }

  const handleTopicToggle = async (topic, value) => {
    if (value && !(await ensurePushMaster())) return
    const nextTopics = {
      ...(settings?.topics || {}),
      [topic]: { ...(settings?.topics?.[topic] || {}), push: value }
    }
    await saveSettings({ topics: nextTopics })
  }

  const handleNewEventsToggle = async (value) => {
    if (value) {
      if (!(await ensurePushMaster())) return
      const names = selectedCategories.length ? selectedCategories : ['Todas']
      setNewEventsEnabled(true)
      setSelectedCategories(names)
      await saveSettings({
        categories_enabled: names.includes('Todas') ? ['*'] : names.map(catId)
      })
    } else {
      setNewEventsEnabled(false)
      setSelectedCategories([])
      await saveSettings({ categories_enabled: [] })
    }
  }

  const handleCategoriesChange = async (value) => {
    if (value.includes('Todas')) {
      setSelectedCategories(['Todas'])
      await saveSettings({ categories_enabled: ['*'] })
    } else {
      setSelectedCategories(value)
      await saveSettings({ categories_enabled: value.map(catId) })
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

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos.')
      return
    }
    const pwdError = validatePassword(newPassword)
    if (pwdError) {
      setPasswordError(pwdError)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação não confere com a nova senha.')
      return
    }

    setPasswordBusy(true)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: currentPassword
    })

    if (verifyError) {
      setPasswordBusy(false)
      setPasswordError('Senha atual incorreta.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    setPasswordBusy(false)

    if (updateError) {
      setPasswordError('Erro ao alterar a senha. Tente novamente.')
    } else {
      setPasswordMessage('Senha alterada com sucesso.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleSaveName = async () => {
    setNameError('')
    setNameMessage('')
    const name = displayName.trim()
    if (!name) {
      setNameError('Informe seu nome.')
      return
    }

    setNameBusy(true)
    const { error } = await supabase.rpc('update_my_profile_name', {
      new_name: name
    })
    setNameBusy(false)

    if (error) {
      setNameError('Erro ao salvar o nome. Tente novamente.')
    } else {
      setNameMessage('Nome atualizado com sucesso.')
      refreshProfile()
    }
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
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton lines={6} />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="Perfil" value="perfil" />
        <Tab label="Notificações" value="notificacoes" />
        <Tab label="Lembretes" value="lembretes" />
        <Tab label="Instalar app" value="instalar" />
      </Tabs>

      {tab === 'perfil' && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Perfil
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Nome"
              fullWidth
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value)
                setNameMessage('')
                setNameError('')
              }}
              autoComplete="name"
            />
            {nameError && <Alert severity="error">{nameError}</Alert>}
            {nameMessage && <Alert severity="success">{nameMessage}</Alert>}
            <Button
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
              onClick={handleSaveName}
              disabled={nameBusy}
            >
              {nameBusy ? <CircularProgress size={24} /> : 'Salvar nome'}
            </Button>

            <TextField
              label="E-mail"
              fullWidth
              disabled
              value={profile?.email || user?.email || ''}
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle1" fontWeight={600}>
              Alterar senha
            </Typography>
            <TextField
              label="Senha atual"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword((prev) => !prev)}
                  />
                )
              }}
            />
            <TextField
              label="Nova senha"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              helperText="Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo."
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword((prev) => !prev)}
                  />
                )
              }}
            />
            <TextField
              label="Confirmar nova senha"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <PasswordToggle
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  />
                )
              }}
            />
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordMessage && (
              <Alert severity="success">{passwordMessage}</Alert>
            )}
            <Button
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
              onClick={handleChangePassword}
              disabled={passwordBusy}
            >
              {passwordBusy ? <CircularProgress size={24} /> : 'Alterar senha'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      )}

      {tab === 'notificacoes' && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notificações
          </Typography>
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography>Receber notificações push</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ative para escolher abaixo o que quer receber no celular.
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
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell align="center">Celular</TableCell>
                    <TableCell align="center">E-mail</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {NOTIFICATION_ROWS.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={topicChannel(settings, row.key, 'push')}
                          onChange={(e) =>
                            handleTopicToggle(row.key, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Em breve">
                          <span>
                            <Switch size="small" disabled />
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Eventos
                      </Typography>
                      <Autocomplete
                        multiple
                        size="small"
                        disabled={!newEventsEnabled}
                        options={['Todas', ...categories.map((c) => c.name)]}
                        value={selectedCategories}
                        onChange={(e, newValue) =>
                          handleCategoriesChange(newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Categorias"
                            placeholder="Todas"
                          />
                        )}
                        sx={{ maxWidth: 320 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                      <Switch
                        size="small"
                        checked={newEventsEnabled}
                        onChange={(e) =>
                          handleNewEventsToggle(e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                      <Tooltip title="Em breve">
                        <span>
                          <Switch size="small" disabled />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Button
                size="small"
                variant="outlined"
                onClick={handleTestNotification}
                sx={{ mt: 2 }}
              >
                Testar notificação
              </Button>
              {testResult && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {testResult}
                </Alert>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
      )}

      {tab === 'lembretes' && (
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
                      startIcon={<Pencil size={18} />}
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
                      startIcon={<Trash2 size={18} />}
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
      )}

      {tab === 'instalar' && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Instalar App
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Instale o Radar Lema na tela inicial para acessar como um
            aplicativo.
          </Typography>
          <InstallAppButton />
        </CardContent>
      </Card>
      )}

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
