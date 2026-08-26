import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchArticles, deleteArticle } from '../services/articlesData'
import { fetchUnoUpdates, deleteUnoUpdate } from '../services/unoUpdatesData'
import { fetchMaterials, deleteMaterial, deleteMaterialFile } from '../services/materialsData'
import { visibilityLabel, unoUpdateTypeLabel, formatHubDate } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'

function itemMeta(item) {
  return `${visibilityLabel(item.visibility)} · ${formatHubDate(item.created_at)}`
}

export default function ManageHub() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('articles')
  const [articles, setArticles] = useState([])
  const [updates, setUpdates] = useState([])
  const [materials, setMaterials] = useState([])
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.saved ? 'Conteúdo salvo com sucesso.' : ''
  )
  const [deleteSnackbar, setDeleteSnackbar] = useState(false)

  useEffect(() => {
    if (location.state?.saved) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000)
      window.history.replaceState({}, '')
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [articlesData, updatesData, materialsData, newsRows] = await Promise.all([
        fetchArticles(),
        fetchUnoUpdates(),
        fetchMaterials(),
        supabase
          .from('news')
          .select('id, title, source, published_at')
          .order('published_at', { ascending: false })
      ])
      setArticles(articlesData)
      setUpdates(updatesData)
      setMaterials(materialsData)
      setNews(newsRows.data ?? [])
    } catch {
      setError('Erro ao carregar o conteúdo do hub.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { kind, item } = deleteTarget
    try {
      if (kind === 'articles') {
        await deleteArticle(item.id)
        setArticles((prev) => prev.filter((a) => a.id !== item.id))
      } else if (kind === 'uno_updates') {
        await deleteUnoUpdate(item.id)
        setUpdates((prev) => prev.filter((u) => u.id !== item.id))
      } else if (kind === 'materials') {
        await deleteMaterial(item.id)
        await deleteMaterialFile(item.storage_path).catch(() => {})
        setMaterials((prev) => prev.filter((m) => m.id !== item.id))
      } else if (kind === 'news') {
        const { data: deleted, error: deleteError } = await supabase
          .from('news')
          .delete()
          .eq('id', item.id)
          .select('id')
        if (deleteError) throw deleteError
        if (!deleted?.length) throw new Error('Exclusão não permitida para esta notícia.')
        setNews((prev) => prev.filter((n) => n.id !== item.id))
      }
      setDeleteSnackbar(true)
    } catch {
      setError('Erro ao excluir o item.')
    }
    setDeleteTarget(null)
  }

  const term = query.trim().toLowerCase()
  const filterByTerm = (items, keys) =>
    term
      ? items.filter((item) => keys.some((k) => item[k]?.toLowerCase().includes(term)))
      : items

  const visibleArticles = filterByTerm(articles, ['title', 'author'])
  const visibleUpdates = filterByTerm(updates, ['title'])
  const visibleMaterials = filterByTerm(materials, ['title', 'description'])
  const visibleNews = filterByTerm(news, ['title', 'source'])

  const visibleItems =
    tab === 'articles'
      ? visibleArticles
      : tab === 'uno_updates'
        ? visibleUpdates
        : tab === 'materials'
          ? visibleMaterials
          : visibleNews

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <PageSkeleton />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1">
          Gestão do hub
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          disabled={tab === 'news'}
          onClick={() => {
            if (tab === 'articles') navigate('/gestao/artigos/novo')
            else if (tab === 'uno_updates') navigate('/gestao/novidades-uno/novo')
            else if (tab === 'materials') navigate('/gestao/materiais/novo')
          }}
        >
          Novo
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="inherit" onClick={fetchData}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Artigos" value="articles" />
        <Tab label="Novidades UNO" value="uno_updates" />
        <Tab label="Materiais" value="materials" />
        <Tab label="Notícias" value="news" />
      </Tabs>

      <TextField
        label="Buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      {visibleItems.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {tab === 'news'
            ? news.length === 0
              ? 'Nenhuma notícia ingerida ainda.'
              : 'Nenhuma notícia encontrada para esta busca.'
            : 'Nenhum item encontrado.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {tab === 'news' && (
            <Typography variant="body2" color="text.secondary">
              {news.length} notícias ingeridas automaticamente dos feeds. Use a
              busca para filtrar e exclua notícias que não fazem sentido — elas
              voltarão na próxima ingestão se ainda estiverem no feed.
            </Typography>
          )}
          {visibleItems.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="h6">{item.title}</Typography>
                      {tab === 'articles' && item.origin === 'blog' && (
                        <Chip label="Blog Lema" size="small" variant="outlined" />
                      )}
                      {tab === 'uno_updates' && (
                        <Chip label={unoUpdateTypeLabel(item.type)} size="small" color="primary" />
                      )}
                      {tab === 'news' && item.source && (
                        <Chip label={item.source} size="small" variant="outlined" />
                      )}
                      {item.visibility === 'lema_client' && (
                        <Chip label="Exclusivo Cliente Lema" size="small" color="secondary" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {tab === 'news'
                        ? formatHubDate(item.published_at)
                        : itemMeta(item)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    {tab !== 'news' && (
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => {
                            if (tab === 'articles') navigate(`/gestao/artigos/${item.id}/editar`)
                            else if (tab === 'uno_updates') navigate(`/gestao/novidades-uno/${item.id}/editar`)
                            else if (tab === 'materials') navigate(`/gestao/materiais/${item.id}/editar`)
                          }}
                          aria-label="Editar"
                        >
                          <Pencil size={20} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Excluir">
                      <IconButton
                        onClick={() => setDeleteTarget({ kind: tab, item })}
                        color="error"
                        aria-label="Excluir"
                      >
                        <Trash2 size={20} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Excluir item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir {deleteTarget?.item?.title}? Esta ação não
            pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={deleteSnackbar}
        autoHideDuration={3000}
        onClose={() => setDeleteSnackbar(false)}
        message="Item excluído com sucesso."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <IconButton size="small" color="inherit" aria-label="Fechar" onClick={() => setDeleteSnackbar(false)}>
            <X size={18} />
          </IconButton>
        }
      />
    </Container>
  )
}
