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
import {
  fetchMaterialById,
  saveMaterial,
  uploadMaterialFile
} from '../services/materialsData'
import { VISIBILITY_OPTIONS, formatFileSize } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'
import { useAuth } from '../contexts/AuthContext'

const EMPTY_FORM = {
  title: '',
  description: '',
  visibility: 'public',
  file: null,
  storage_path: '',
  file_name: '',
  file_size: null,
  file_type: ''
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

export default function MaterialFormPage() {
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
        const data = await fetchMaterialById(id)
        setForm({
          title: data.title || '',
          description: data.description || '',
          visibility: data.visibility || 'public',
          file: null,
          storage_path: data.storage_path || '',
          file_name: data.file_name || '',
          file_size: data.file_size || null,
          file_type: data.file_type || ''
        })
      } catch {
        setError('Material não encontrado.')
      }
      setLoading(false)
    }
    fetchData()
  }, [id, isEdit])

  const updateForm = (fields) => setForm((prev) => ({ ...prev, ...fields }))

  const handleFileChange = (file) => {
    updateForm({
      file,
      file_name: file?.name || '',
      file_size: file?.size || null,
      file_type: file?.type || ''
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Informe o título do material.')
      return
    }
    if (!isEdit && !form.file) {
      setError('Envie o arquivo do material.')
      return
    }

    setSaving(true)
    try {
      let storagePath = form.storage_path
      if (form.file) {
        storagePath = await uploadMaterialFile(form.file)
      }

      const payload = {
        ...(id ? { id } : {}),
        title: form.title.trim(),
        description: form.description.trim() || null,
        visibility: form.visibility,
        storage_path: storagePath,
        file_name: form.file_name,
        file_size: form.file_size,
        file_type: form.file_type,
        created_by: user?.id
      }
      await saveMaterial(payload)
      navigate('/gestao/hub', { state: { saved: true } })
    } catch (err) {
      setError(err.message || 'Erro ao salvar o material.')
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
          {isEdit ? 'Editar material' : 'Novo material'}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Dados do material" />
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
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel id="visibility-label">Visibilidade</InputLabel>
              <Select
                labelId="visibility-label"
                value={form.visibility}
                label="Visibilidade"
                onChange={(e) => updateForm({ visibility: e.target.value })}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              component="label"
              sx={{ alignSelf: 'flex-start' }}
            >
              {form.file_name ? `Arquivo: ${form.file_name}` : 'Escolher arquivo'}
              <input
                type="file"
                hidden
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </Button>
            {form.file && (
              <Typography variant="body2" color="text.secondary">
                {form.file_name} · {formatFileSize(form.file_size)}
              </Typography>
            )}
            {isEdit && !form.file && form.file_name && (
              <Typography variant="body2" color="text.secondary">
                Arquivo atual: {form.file_name}. Envie um novo apenas para substituir.
              </Typography>
            )}
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
