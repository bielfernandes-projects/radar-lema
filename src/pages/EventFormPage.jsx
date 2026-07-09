import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useBlocker } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SessionEditor from '../components/SessionEditor'
import RecurrenceEditor from '../components/RecurrenceEditor'
import PhotoUploader from '../components/PhotoUploader'
import SessionScopeDialog from '../components/SessionScopeDialog'
import { generateRecurringSessions } from '../utils/recurrence'
import { parseDateTime, calculateDelta, applyDelta, emptySession, validate } from '../utils/eventForm'
import { persistEvent } from '../services/eventPersistence'

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'hibrido', label: 'Hibrido' }
]

const EMPTY_FORM = {
  title: '',
  description: '',
  modality: 'presencial',
  category_id: '',
  is_free: true,
  price_from: '',
  city: '',
  state: '',
  address: '',
  url: '',
  is_recurring: false,
  recurrence_freq: 'semanal',
  recurrence_until: ''
}

function SectionHeader({ title, description }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" component="p" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  )
}

export default function EventFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isEdit = Boolean(id)
  const isDuplicate = searchParams.get('modo') === 'duplicar'

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [sessions, setSessions] = useState([emptySession()])
  const [originalSessions, setOriginalSessions] = useState([])
  const [photos, setPhotos] = useState([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState([])
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false)
  const actionsRef = useRef(null)
  const errorRef = useRef(null)
  const formRef = useRef(null)
  const initialFormRef = useRef(null)

  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setBlockerDialogOpen(true)
    }
  }, [blocker.state])

  const handleBlockerConfirm = () => {
    setBlockerDialogOpen(false)
    setIsDirty(false)
    blocker.proceed()
  }

  const handleBlockerCancel = () => {
    setBlockerDialogOpen(false)
    blocker.reset()
  }

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!initialFormRef.current || loading) return
    const current = JSON.stringify({ form, sessions })
    setIsDirty(current !== initialFormRef.current)
  }, [form, sessions, loading])

  useEffect(() => {
    const handleScroll = () => {
      if (!actionsRef.current) return
      const rect = actionsRef.current.getBoundingClientRect()
      setShowStickyBar(rect.bottom < 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  useEffect(() => {
    const fetchData = async () => {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories(categoriesData || [])

      if (!isEdit) {
        setLoading(false)
        return
      }

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

      const [{ data: sessionsData }, { data: photosData }] = await Promise.all([
        supabase
          .from('event_sessions')
          .select('*')
          .eq('event_id', id)
          .order('start_date', { ascending: true }),
        supabase
          .from('event_photos')
          .select('*')
          .eq('event_id', id)
          .order('sort_order', { ascending: true })
      ])

      const nextForm = {
        title: eventData.title || '',
        description: eventData.description || '',
        modality: eventData.modality || 'presencial',
        category_id: eventData.category_id || '',
        is_free: eventData.is_free ?? true,
        price_from: eventData.price_from ?? '',
        city: eventData.city || '',
        state: eventData.state || '',
        address: eventData.address || '',
        url: eventData.url || '',
        is_recurring: eventData.is_recurring || false,
        recurrence_freq: eventData.recurrence_freq || 'semanal',
        recurrence_until: eventData.recurrence_until || ''
      }

      const loadedSessions = sessionsData?.length
        ? sessionsData
        : [emptySession()]

      if (isDuplicate) {
        setForm(nextForm)
        setSessions(loadedSessions.map((s) => ({ ...s, id: undefined })))
        setOriginalSessions(loadedSessions.map((s) => ({ ...s, id: undefined })))
        setPhotos([])
      } else {
        setForm(nextForm)
        setSessions(loadedSessions)
        setOriginalSessions(JSON.parse(JSON.stringify(loadedSessions)))
        setPhotos(photosData || [])
      }

      initialFormRef.current = JSON.stringify({
        form: nextForm,
        sessions: loadedSessions
      })

      setLoading(false)
    }

    fetchData()
  }, [id, isEdit, isDuplicate])

  const updateForm = (fields) => {
    setForm((prev) => ({ ...prev, ...fields }))
  }

  const handleGenerateSessions = () => {
    if (!form.is_recurring || !form.recurrence_freq || !form.recurrence_until) {
      setError('Preencha frequência e data fim da recorrência.')
      return
    }

    const base = sessions[0]
    if (!base) {
      setError('Adicione a primeira sessao antes de gerar recorrencia.')
      return
    }

    const generated = generateRecurringSessions(
      base,
      form.recurrence_freq,
      form.recurrence_until
    )

    setSessions(generated)
    setError('')
  }

  const getChangedSessions = () => {
    return sessions
      .map((current) => {
        const original = originalSessions.find((o) => o.id === current.id)
        if (!original) return null
        const changed =
          original.start_date !== current.start_date ||
          original.start_time !== current.start_time ||
          original.end_date !== current.end_date ||
          original.end_time !== current.end_time
        return changed ? { original, current } : null
      })
      .filter(Boolean)
  }

  const applySessionScope = (scope) => {
    if (scope === 'single' || originalSessions.length === 0) {
      return sessions
    }

    const changed = getChangedSessions()
    if (changed.length === 0) return sessions

    const reference = changed.reduce((acc, item) => {
      const refDate = parseDateTime(acc.current.start_date, acc.current.start_time)
      const itemDate = parseDateTime(item.current.start_date, item.current.start_time)
      return itemDate < refDate ? item : acc
    }, changed[0])

    const delta = calculateDelta(reference.original, reference.current)
    const referenceStartDate = reference.current.start_date
    const changedIds = new Set(changed.map((c) => c.current.id).filter(Boolean))

    return sessions.map((session) => {
      if (changedIds.has(session.id)) {
        return session
      }

      const sessionDate = parseDateTime(session.start_date, session.start_time)
      const refDate = parseDateTime(referenceStartDate, '00:00:00')

      if (scope === 'following' && sessionDate < refDate) {
        return session
      }

      return applyDelta(session, delta)
    })
  }

  const handlePersist = async (sessionsToSave) => {
    setSaving(true)

    try {
      await persistEvent({
        form,
        sessionsToSave,
        eventId: id,
        isEdit,
        isDuplicate,
        user,
        photos,
        removedPhotoIds
      })

      setIsDirty(false)
      navigate('/gestao', { state: { saved: true } })
    } catch (err) {
      setError(err.message || 'Erro ao salvar evento.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validationError = validate(form, sessions)
    if (validationError) {
      setError(validationError)
      return
    }

    const changedSessions = getChangedSessions()
    const needsScopeDialog =
      form.is_recurring &&
      (isEdit || isDuplicate) &&
      changedSessions.length > 0

    if (needsScopeDialog) {
      setScopeDialogOpen(true)
      return
    }

    await handlePersist(sessions)
  }

  const handleConfirmScope = async (scope) => {
    setScopeDialogOpen(false)
    const sessionsToSave = applySessionScope(scope)
    setSessions(sessionsToSave)
    await handlePersist(sessionsToSave)
  }

  const handlePhotosChange = (nextPhotos) => {
    const removed = photos
      .filter((p) => p.id && !nextPhotos.some((np) => np.id === p.id))
      .map((p) => p.id)
    setRemovedPhotoIds((prev) => [...prev, ...removed])
    setPhotos(nextPhotos)
  }

  const pageTitle = isDuplicate
    ? 'Duplicar evento'
    : isEdit
      ? 'Editar evento'
      : 'Novo evento'

  const showAddressFields = form.modality !== 'online'
  const showPriceField = !form.is_free
  const isPastRecurrence =
    form.is_recurring &&
    form.recurrence_until &&
    form.recurrence_until < new Date().toISOString().slice(0, 10)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/gestao')}
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>
      </Stack>

      {error && (
        <Alert ref={errorRef} severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isDuplicate && isPastRecurrence && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Datas no passado. Ajuste antes de salvar.
        </Alert>
      )}

      <Box ref={formRef} component="form" onSubmit={handleSubmit}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Identificação" description="Dados básicos do evento" />
          <Stack spacing={2}>
            <TextField
              label="Título"
              fullWidth
              required
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
            />

            <TextField
              label="Descricao"
              fullWidth
              required
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
            />

            <FormControl fullWidth required>
              <InputLabel id="category-label">Categoria</InputLabel>
              <Select
                labelId="category-label"
                value={form.category_id}
                label="Categoria"
                onChange={(e) => updateForm({ category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Modalidade e Local" description="Como e onde o evento acontece" />
          <Stack spacing={2}>
            <FormControl fullWidth required>
              <InputLabel id="modality-label">Modalidade</InputLabel>
              <Select
                labelId="modality-label"
                value={form.modality}
                label="Modalidade"
                onChange={(e) => updateForm({ modality: e.target.value })}
              >
                {MODALITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {showAddressFields && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Cidade"
                    fullWidth
                    value={form.city}
                    onChange={(e) => updateForm({ city: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="UF"
                    fullWidth
                    inputProps={{ maxLength: 2 }}
                    value={form.state}
                    onChange={(e) => updateForm({ state: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Endereco"
                    fullWidth
                    required
                    value={form.address}
                    onChange={(e) => updateForm({ address: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Inscrição e Valor" />
          <Stack spacing={2}>
            <TextField
              label="Link de inscrição"
              fullWidth
              required
              type="url"
              value={form.url}
              onChange={(e) => updateForm({ url: e.target.value })}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_free}
                  onChange={(e) => updateForm({ is_free: e.target.checked })}
                />
              }
              label="Evento gratuito"
            />

            {showPriceField && (
              <TextField
                label="Valor a partir de (R$)"
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.price_from}
                onChange={(e) => updateForm({ price_from: e.target.value })}
              />
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Recorrência" description="Gere sessões repetidas automaticamente" />
          <Stack spacing={2}>
            <RecurrenceEditor
              isRecurring={form.is_recurring}
              frequency={form.recurrence_freq}
              untilDate={form.recurrence_until}
              onChange={({ isRecurring, frequency, untilDate }) =>
                updateForm({
                  is_recurring: isRecurring,
                  recurrence_freq: frequency,
                  recurrence_until: untilDate
                })
              }
            />

            {form.is_recurring && (
              <Button
                variant="outlined"
                onClick={handleGenerateSessions}
                sx={{ alignSelf: 'flex-start' }}
              >
                Gerar sessões automaticamente
              </Button>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Sessões" description="Datas e horários do evento" />
          <SessionEditor sessions={sessions} onChange={setSessions} />
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Fotos" description="Ate 5 fotos. A primeira aparece na capa." />
          <PhotoUploader photos={photos} onChange={handlePhotosChange} />
        </Paper>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          ref={actionsRef}
          sx={{ py: 2 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/gestao')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} />}
          >
            Salvar
          </Button>
        </Stack>
      </Box>

      {showStickyBar && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            zIndex: 1200,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/gestao')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} />}
            onClick={() => {
              if (formRef.current) formRef.current.requestSubmit()
            }}
          >
            Salvar
          </Button>
        </Box>
      )}

      <SessionScopeDialog
        open={scopeDialogOpen}
        onClose={() => setScopeDialogOpen(false)}
        onConfirm={handleConfirmScope}
      />

      <Dialog open={blockerDialogOpen} onClose={handleBlockerCancel}>
        <DialogTitle>Sair sem salvar?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem alterações não salvas. Se sair agora, elas serão perdidas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBlockerCancel}>Continuar editando</Button>
          <Button onClick={handleBlockerConfirm} color="error">
            Sair mesmo assim
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
