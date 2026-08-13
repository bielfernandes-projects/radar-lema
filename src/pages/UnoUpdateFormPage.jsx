import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import { fetchUnoUpdateById, saveUnoUpdate } from '../services/unoUpdatesData'
import { UNO_UPDATE_TYPES } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'
import { useAuth } from '../contexts/AuthContext'

const EMPTY_FORM = {
  title: '',
  body: '',
  type: 'atualizacao'
}

function SectionHeader({ title, description }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
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

export default function UnoUpdateFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!isEdit) return
    const fetchData = async () => {
      try {
        const data = await fetchUnoUpdateById(id)
        setForm({
          title: data.title || '',
          body: data.body || '',
          type: data.type || 'atualizacao'
        })
      } catch {
        setError('Novidade não encontrada.')
      }
      setLoading(false)
    }
    fetchData()
  }, [id, isEdit])

  const updateForm = (fields) => setForm((prev) => ({ ...prev, ...fields }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Informe o título da novidade.')
      return
    }
    if (!form.body.trim()) {
      setError('Descreva a novidade.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(id ? { id } : {}),
        title: form.title.trim(),
        body: form.body,
        type: form.type,
        created_by: user?.id
      }
      await saveUnoUpdate(payload)
      navigate('/gestao/hub', { state: { saved: true } })
    } catch {
      setError('Erro ao salvar a novidade.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton lines={6} />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button startIcon={<ArrowLeft size={20} />} onClick={() => navigate('/gestao/hub')}>
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Editar novidade UNO' : 'Nova novidade UNO'}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader
            title="Novidade UNO"
            description="Aviso sobre o sistema UNO: atualizações, manutenção, bugs e instabilidades."
          />
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Tipo</InputLabel>
              <Select
                labelId="type-label"
                value={form.type}
                label="Tipo"
                onChange={(e) => updateForm({ type: e.target.value })}
              >
                {UNO_UPDATE_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Título"
              fullWidth
              required
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
            />
            <TextField
              label="Texto"
              fullWidth
              required
              multiline
              rows={6}
              value={form.body}
              onChange={(e) => updateForm({ body: e.target.value })}
            />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ py: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/gestao/hub')} disabled={saving}>
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
    </Container>
  )
}
