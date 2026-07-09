import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
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

function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`)
}

function formatDateTime(date) {
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 19)
  }
}

function calculateDelta(original, updated) {
  const origStart = parseDateTime(original.start_date, original.start_time)
  const origEnd = parseDateTime(original.end_date, original.end_time)
  const updStart = parseDateTime(updated.start_date, updated.start_time)
  const updEnd = parseDateTime(updated.end_date, updated.end_time)

  return {
    startDeltaMs: updStart.getTime() - origStart.getTime(),
    durationDeltaMs: updEnd.getTime() - updStart.getTime() - (origEnd.getTime() - origStart.getTime())
  }
}

function applyDelta(session, delta) {
  const start = parseDateTime(session.start_date, session.start_time)
  const end = parseDateTime(session.end_date, session.end_time)

  const newStart = new Date(start.getTime() + delta.startDeltaMs)
  const newEnd = new Date(end.getTime() + delta.startDeltaMs + delta.durationDeltaMs)

  const startFmt = formatDateTime(newStart)
  const endFmt = formatDateTime(newEnd)

  return {
    ...session,
    start_date: startFmt.date,
    start_time: startFmt.time,
    end_date: endFmt.date,
    end_time: endFmt.time
  }
}

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

function emptySession() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    start_date: today,
    start_time: '09:00:00',
    end_date: today,
    end_time: '10:00:00'
  }
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
        setError('Evento nao encontrado.')
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
          .order('order', { ascending: true })
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

      setLoading(false)
    }

    fetchData()
  }, [id, isEdit, isDuplicate])

  const updateForm = (fields) => {
    setForm((prev) => ({ ...prev, ...fields }))
  }

  const handleGenerateSessions = () => {
    if (!form.is_recurring || !form.recurrence_freq || !form.recurrence_until) {
      setError('Preencha frequencia e data fim da recorrencia.')
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

  const validate = () => {
    if (!form.title.trim()) return 'Titulo e obrigatorio.'
    if (!form.description.trim()) return 'Descricao e obrigatoria.'
    if (!form.url.trim()) return 'Link de inscricao e obrigatorio.'
    if (!form.category_id) return 'Categoria e obrigatoria.'
    if (form.modality !== 'online' && !form.address.trim()) {
      return 'Endereco e obrigatorio para eventos presenciais ou hibridos.'
    }
    if (!form.is_free && !form.price_from) return 'Informe o valor a partir de.'
    if (sessions.length === 0) return 'Adicione pelo menos uma sessao.'
    if (form.is_recurring && (!form.recurrence_freq || !form.recurrence_until)) {
      return 'Preencha frequencia e data fim para eventos recorrentes.'
    }
    if (form.is_recurring && form.recurrence_until < new Date().toISOString().slice(0, 10)) {
      return 'Datas no passado. Ajuste a data fim da recorrencia antes de salvar.'
    }

    for (const session of sessions) {
      if (!session.start_date || !session.start_time || !session.end_date || !session.end_time) {
        return 'Preencha data e horario de todas as sessoes.'
      }
    }

    return ''
  }

  const uploadPhotos = async (eventId) => {
    const newPhotos = []
    for (const photo of photos) {
      if (photo.file) {
        const ext = photo.file.name.split('.').pop()
        const path = `events/${eventId}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(path, photo.file)

        if (uploadError) {
          throw new Error(`Erro ao enviar foto: ${uploadError.message}`)
        }

        const {
          data: { publicUrl }
        } = supabase.storage.from('event-photos').getPublicUrl(path)

        newPhotos.push({
          event_id: eventId,
          storage_path: path,
          public_url: publicUrl,
          order: newPhotos.length + photos.filter((p) => p.id).length
        })
      }
    }

    if (newPhotos.length > 0) {
      const { error: insertError } = await supabase
        .from('event_photos')
        .insert(newPhotos)
      if (insertError) throw insertError
    }
  }

  const saveSessions = async (eventId, sessionsToSave) => {
    const existingIds = sessionsToSave
      .filter((s) => s.id)
      .map((s) => s.id)

    const { data: existingSessions } = await supabase
      .from('event_sessions')
      .select('id')
      .eq('event_id', eventId)

    const toDelete = (existingSessions || [])
      .filter((s) => !existingIds.includes(s.id))
      .map((s) => s.id)

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('event_sessions')
        .delete()
        .in('id', toDelete)
      if (deleteError) throw deleteError
    }

    for (const session of sessionsToSave) {
      const payload = {
        event_id: eventId,
        start_date: session.start_date,
        start_time: session.start_time,
        end_date: session.end_date,
        end_time: session.end_time,
        recurrence_instance: session.recurrence_instance ?? false
      }

      if (session.id) {
        const { error: updateError } = await supabase
          .from('event_sessions')
          .update(payload)
          .eq('id', session.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('event_sessions')
          .insert(payload)
        if (insertError) throw insertError
      }
    }
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

  const persistEvent = async (sessionsToSave) => {
    setSaving(true)

    try {
      const eventPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        modality: form.modality,
        category_id: form.category_id,
        is_free: form.is_free,
        price_from: form.is_free ? null : Number(form.price_from),
        city: form.modality === 'online' ? null : form.city.trim() || null,
        state: form.modality === 'online' ? null : form.state.trim() || null,
        address: form.modality === 'online' ? null : form.address.trim() || null,
        url: form.url.trim(),
        is_recurring: form.is_recurring,
        recurrence_freq: form.is_recurring ? form.recurrence_freq : null,
        recurrence_until: form.is_recurring ? form.recurrence_until : null,
        created_by: user.id
      }

      let eventId = id

      if (isEdit && !isDuplicate) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert(eventPayload)
          .select('id')
          .single()
        if (insertError) throw insertError
        eventId = newEvent.id
      }

      if (removedPhotoIds.length > 0) {
        const { data: removedPhotos } = await supabase
          .from('event_photos')
          .select('storage_path')
          .in('id', removedPhotoIds)

        await supabase.from('event_photos').delete().in('id', removedPhotoIds)

        const paths = removedPhotos?.map((p) => p.storage_path).filter(Boolean) || []
        if (paths.length > 0) {
          await supabase.storage.from('event-photos').remove(paths)
        }
      }

      await uploadPhotos(eventId)
      await saveSessions(eventId, sessionsToSave)

      navigate('/gestao')
    } catch (err) {
      setError(err.message || 'Erro ao salvar evento.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validationError = validate()
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

    await persistEvent(sessions)
  }

  const handleConfirmScope = async (scope) => {
    setScopeDialogOpen(false)
    const sessionsToSave = applySessionScope(scope)
    setSessions(sessionsToSave)
    await persistEvent(sessionsToSave)
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isDuplicate && isPastRecurrence && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Datas no passado. Ajuste antes de salvar.
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Titulo"
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

          <TextField
            label="Link de inscricao"
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
            label="Gratuito"
          />

          {showPriceField && (
            <TextField
              label="Valor a partir de"
              fullWidth
              required
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={form.price_from}
              onChange={(e) => updateForm({ price_from: e.target.value })}
            />
          )}

          <Divider />

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
              Gerar sessoes pela recorrencia
            </Button>
          )}

          <Divider />

          <SessionEditor sessions={sessions} onChange={setSessions} />

          <Divider />

          <PhotoUploader photos={photos} onChange={handlePhotosChange} />

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
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
        </Stack>
      </Paper>

      <SessionScopeDialog
        open={scopeDialogOpen}
        onClose={() => setScopeDialogOpen(false)}
        onConfirm={handleConfirmScope}
      />
    </Container>
  )
}
