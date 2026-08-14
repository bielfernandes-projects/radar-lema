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
import { fetchArticleById, saveArticle, uploadArticleCover } from '../services/articlesData'
import { VISIBILITY_OPTIONS } from '../utils/hub'
import { safeUrl } from '../utils/safeUrl'
import PageSkeleton from '../components/PageSkeleton'
import Markdown from '../components/Markdown'
import { useAuth } from '../contexts/AuthContext'

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  author: '',
  body: '',
  cover_url: '',
  visibility: 'public',
  source_url: ''
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

export default function ArticleFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    if (!isEdit) return
    const fetchData = async () => {
      try {
        const data = await fetchArticleById(id)
        setForm({
          title: data.title || '',
          subtitle: data.subtitle || '',
          author: data.author || '',
          body: data.body || '',
          cover_url: data.cover_url || '',
          visibility: data.visibility || 'public',
          source_url: data.source_url || ''
        })
      } catch {
        setError('Artigo não encontrado.')
      }
      setLoading(false)
    }
    fetchData()
  }, [id, isEdit])

  const updateForm = (fields) => setForm((prev) => ({ ...prev, ...fields }))

  const handleCoverSelect = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    updateForm({ cover_url: '' })
  }

  const handleCoverRemove = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview('')
    updateForm({ cover_url: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Informe o título do artigo.')
      return
    }
    if (!form.body.trim()) {
      setError('Escreva o corpo do artigo em Markdown.')
      return
    }

    setSaving(true)
    try {
      let coverUrl = form.cover_url
      if (coverFile) {
        coverUrl = await uploadArticleCover(coverFile)
      }

      const payload = {
        ...(id ? { id } : {}),
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        author: form.author.trim() || null,
        body: form.body,
        cover_url: (coverUrl || '').trim() || null,
        visibility: form.visibility,
        source_url: safeUrl(form.source_url) || null,
        created_by: user?.id
      }
      await saveArticle(payload)
      navigate('/gestao/hub', { state: { saved: true } })
    } catch (err) {
      setError(err.message || 'Erro ao salvar o artigo.')
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
          {isEdit ? 'Editar artigo' : 'Novo artigo'}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader title="Identificação" description="Dados editoriais do artigo" />
          <Stack spacing={2}>
            <TextField
              label="Título"
              fullWidth
              required
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
            />
            <TextField
              label="Subtítulo"
              fullWidth
              value={form.subtitle}
              onChange={(e) => updateForm({ subtitle: e.target.value })}
            />
            <TextField
              label="Autor"
              fullWidth
              value={form.author}
              onChange={(e) => updateForm({ author: e.target.value })}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Capa
              </Typography>
              {(coverPreview || form.cover_url) && (
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 360, mb: 1 }}>
                  <Box
                    component="img"
                    src={coverPreview || form.cover_url}
                    alt="Prévia da capa"
                    sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                  />
                </Box>
              )}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button variant="outlined" component="label" sx={{ alignSelf: 'flex-start' }}>
                  {coverPreview || form.cover_url ? 'Trocar imagem' : 'Escolher imagem'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleCoverSelect}
                  />
                </Button>
                {(coverPreview || form.cover_url) && (
                  <Button size="small" color="error" onClick={handleCoverRemove}>
                    Remover
                  </Button>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                A capa é hospedada no Supabase (bucket article-covers). Evite links
                externos, que costumam quebrar.
              </Typography>
            </Box>
            <TextField
              label="Link original (LinkedIn)"
              fullWidth
              type="url"
              value={form.source_url}
              onChange={(e) => updateForm({ source_url: e.target.value })}
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
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <SectionHeader
            title="Corpo (Markdown)"
            description="Suporta títulos, negrito, itálico, listas, código, links e citações."
          />
          <TextField
            label="Corpo"
            fullWidth
            required
            multiline
            rows={12}
            value={form.body}
            onChange={(e) => updateForm({ body: e.target.value })}
          />
        </Paper>

        {form.body.trim() && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
            <SectionHeader title="Pré-visualização" />
            <Markdown content={form.body} />
          </Paper>
        )}

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
