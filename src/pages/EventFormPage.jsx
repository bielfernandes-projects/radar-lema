import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useBlocker } from 'react-router-dom'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
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
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SessionEditor from '../components/SessionEditor'
import RecurrenceEditor from '../components/RecurrenceEditor'
import PhotoUploader from '../components/PhotoUploader'
import SessionScopeDialog from '../components/SessionScopeDialog'
import PageSkeleton from '../components/PageSkeleton'
import { generateRecurringSessions } from '../utils/recurrence'
import { parseDateTime, calculateDelta, applyDelta, emptySession, validate } from '../utils/eventForm'
import { persistEvent } from '../services/eventPersistence'

const MODALITY_OPTIONS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'hibrido', label: 'Híbrido' }
]

const EMPTY_FORM = {
  title: '',
  description: '',
  modality: 'presencial',
  category_ids: [],
  is_lema_edu: false,
  is_tentative: false,
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
  const [confirmTentativeDialog, setConfirmTentativeDialog] = useState(false)
  const [originallyConfirmed, setOriginallyConfirmed] = useState(true)
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
        initialFormRef.current = JSON.stringify({
          form: EMPTY_FORM,
          sessions: [emptySession()]
        })
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

      setOriginallyConfirmed(eventData.is_confirmed ?? true)

      const [
        { data: sessionsData },
        { data: photosData },
        { data: eventCategoriesData }
      ] = await Promise.all([
        supabase
          .from('event_sessions')
          .select('*')
          .eq('event_id', id)
          .order('start_date', { ascending: true }),
        supabase
          .from('event_photos')
          .select('*')
          .eq('event_id', id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('event_categories')
          .select('category_id')
          .eq('event_id', id)
      ])

      const nextForm = {
        title: eventData.title || '',
        description: eventData.description || '',
        modality: eventData.modality || 'presencial',
        category_ids:
          eventCategoriesData?.map((c) => c.category_id) || [],
        is_lema_edu: eventData.is_lema_edu ?? false,
        is_tentative: !(eventData.is_confirmed ?? true),
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

  const handleTentativeToggle = (checked) => {
    const isDeconfirming =
      checked && isEdit && !isDuplicate && originallyConfirmed

    if (isDeconfirming) {
      setConfirmTentativeDialog(true)
      return
    }

    updateForm({ is_tentative: checked })
  }

  const handleGenerateSessions = () => {
    if (!form.is_recurring || !form.recurrence_freq || !form.recurrence_until) {
      setError('Preencha frequência e data fim da recorrência.')
      return
    }

    const base = sessions[0]
    if (!base) {
      setError('Adicione a primeira sessão antes de gerar a recorrência.')
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

  const getScopePlan = (scope) => {
    if (originalSessions.length === 0) {
      return { sessions, affectedIds: new Set() }
    }

    const changed = getChangedSessions()
    const changedIds = new Set(changed.map((c) => c.current.id).filter(Boolean))
    const affectedIds = new Set(changedIds)

    if (scope === 'single' || changed.length === 0) {
      return { sessions, affectedIds }
    }

    const reference = changed.reduce((acc, item) => {
      const refDate = parseDateTime(acc.current.start_date, acc.current.start_time)
      const itemDate = parseDateTime(item.current.start_date, item.current.start_time)
      return itemDate < refDate ? item : acc
    }, changed[0])

    const delta = calculateDelta(reference.original, reference.current)
    const referenceStartDate = reference.current.start_date

    const next = sessions.map((session) => {
      if (changedIds.has(session.id)) {
        return session
      }

      const sessionDate = parseDateTime(session.start_date, session.start_time)
      const refDate = parseDateTime(referenceStartDate, '00:00:00')

      if (scope === 'following' && sessionDate < refDate) {
        return session
      }

      affectedIds.add(session.id)
      return applyDelta(session, delta)
    })

    return { sessions: next, affectedIds }
  }

  const applySessionScope = (scope) => getScopePlan(scope).sessions

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
      setTimeout(() => navigate('/gestao', { state: { saved: true } }), 0)
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
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton lines={8} />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
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

      {isDuplicate && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Fotos não são copiadas na duplicação — reenvie-as antes de salvar.
        </Alert>
      )}

      {isDuplicate && isPastRecurrence && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Datas no passado. Ajuste antes de salvar.
        </Alert>
      )}

      <Box ref={formRef} component="form" onSubmit={handleSubmit} noValidate>
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
              label="Descrição"
              fullWidth
              required={!form.is_tentative}
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
            />

            <Autocomplete
              multiple
              options={categories.map((c) => c.id)}
              getOptionLabel={(categoryId) =>
                categories.find((c) => c.id === categoryId)?.name || categoryId
              }
              value={form.category_ids}
              onChange={(e, value) => updateForm({ category_ids: value })}
              renderTags={(value, getTagProps) =>
                value.map((categoryId, index) => {
                  const name =
                    categories.find((c) => c.id === categoryId)?.name || categoryId
                  return (
                    <Chip
                      variant="outlined"
                      label={name}
                      size="small"
                      {...getTagProps({ index })}
                      key={categoryId}
                    />
                  )
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categorias"
                  required={!form.is_tentative}
                  helperText="Selecione uma ou mais categorias do evento."
                />
              )}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_lema_edu}
                  onChange={(e) => updateForm({ is_lema_edu: e.target.checked })}
                />
              }
              label="Evento Lema Edu"
            />

            <FormControlLabel
              sx={{
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': { mt: '7px' },
              }}
              control={
                <Switch
                  checked={form.is_tentative}
                  onChange={(e) => handleTentativeToggle(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Box component="span" sx={{ display: 'block' }}>
                    A definir
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.25 }}
                  >
                    O evento não aparecerá para clientes até ser confirmado.
                  </Typography>
                </Box>
              }
            />
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
                    label="Endereço"
                    fullWidth
                    required={!form.is_tentative}
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
              required={!form.is_tentative}
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
                required={!form.is_tentative}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.price_from}
                onChange={(e) => updateForm({ price_from: e.target.value })}
                sx={{
                  '& input[type=number]': { MozAppearance: 'textfield' },
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  }
                }}
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
        getScopeCount={(scope) => getScopePlan(scope).affectedIds.size}
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

      <Dialog
        open={confirmTentativeDialog}
        onClose={() => setConfirmTentativeDialog(false)}
      >
        <DialogTitle>Marcar como &quot;A definir&quot;?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este evento deixará de aparecer para os clientes até ser
            confirmado.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTentativeDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setConfirmTentativeDialog(false)
              updateForm({ is_tentative: true })
            }}
            color="warning"
            variant="contained"
          >
            Marcar como a definir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
