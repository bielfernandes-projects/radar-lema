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
import { HUB_KINDS, hubKind, removeHubContent } from '../services/hubContent'
import { visibilityLabel, unoUpdateTypeLabel, formatHubDate } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'

function itemMeta(item) {
  return `${visibilityLabel(item.visibility)} · ${formatHubDate(item.created_at)}`
}

export default function ManageHub() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('articles')
  const [itemsByKind, setItemsByKind] = useState({})
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
      const results = await Promise.all(HUB_KINDS.map((k) => k.fetchList()))
      setItemsByKind(
        Object.fromEntries(HUB_KINDS.map((k, i) => [k.kind, results[i]]))
      )
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
      await removeHubContent(kind, item)
      setItemsByKind((prev) => ({
        ...prev,
        [kind]: (prev[kind] ?? []).filter((i) => i.id !== item.id)
      }))
      setDeleteSnackbar(true)
    } catch {
      setError('Erro ao excluir o item.')
    }
    setDeleteTarget(null)
  }

  const active = hubKind(tab)
  const term = query.trim().toLowerCase()
  const allItems = itemsByKind[tab] ?? []
  const visibleItems = term
    ? allItems.filter((item) =>
        active.searchKeys.some((k) => item[k]?.toLowerCase().includes(term))
      )
    : allItems

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
          disabled={active.readOnly}
          onClick={() => active.newPath && navigate(active.newPath)}
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
        {HUB_KINDS.map((k) => (
          <Tab key={k.kind} label={k.label} value={k.kind} />
        ))}
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
          {active.kind === 'news'
            ? allItems.length === 0
              ? 'Nenhuma notícia ingerida ainda.'
              : 'Nenhuma notícia encontrada para esta busca.'
            : 'Nenhum item encontrado.'}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {active.kind === 'news' && (
            <Typography variant="body2" color="text.secondary">
              {allItems.length} notícias ingeridas automaticamente dos feeds. Use a
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
                    {!active.readOnly && (
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => navigate(active.editPath(item.id))}
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
