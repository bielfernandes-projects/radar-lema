import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { Eye, EyeOff, RefreshCw, ShieldAlert, Trash2, X } from 'lucide-react'
import {
  fetchModerationQueue,
  toggleCommentHidden,
  deleteComment
} from '../services/interactionsData'
import { formatHubDateTime } from '../utils/hub'
import PageSkeleton from '../components/PageSkeleton'

const CONTENT_TYPE_LABELS = {
  article: 'Artigo',
  event: 'Evento',
  news: 'Notícia',
  uno_update: 'Novidade UNO'
}

export default function Moderation() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchModerationQueue()
      setComments(data)
    } catch {
      setError('Erro ao carregar a fila de moderação.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleHidden = async (comment) => {
    setError('')
    try {
      await toggleCommentHidden(comment.id, !comment.hidden)
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden } : c))
      )
      setSnackbar(comment.hidden ? 'Comentário exibido novamente.' : 'Comentário ocultado.')
    } catch {
      setError('Erro ao atualizar o comentário.')
    }
  }

  const handleDelete = async (comment) => {
    setError('')
    try {
      await deleteComment(comment.id)
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      setSnackbar('Comentário excluído.')
    } catch {
      setError('Erro ao excluir o comentário.')
    }
  }

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
        <Stack direction="row" spacing={1} alignItems="center">
          <ShieldAlert size={24} />
          <Typography variant="h4" component="h1">
            Moderação
          </Typography>
        </Stack>
        <Button startIcon={<RefreshCw size={18} />} onClick={fetchData}>
          Atualizar
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

      {comments.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Nenhum comentário para moderar.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment) => (
            <Card key={comment.id} variant="outlined" sx={{ opacity: comment.hidden ? 0.6 : 1 }}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        label={CONTENT_TYPE_LABELS[comment.content_type] || comment.content_type}
                        size="small"
                        color="primary"
                      />
                      <Chip label={comment.content_title || 'Sem título'} size="small" variant="outlined" />
                      {comment.hidden && <Chip label="Oculto" size="small" color="error" />}
                      <Typography variant="caption" color="text.secondary">
                        {comment.user_name || 'Usuário'} · {formatHubDateTime(comment.created_at)}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                      {comment.body}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Tooltip title={comment.hidden ? 'Exibir comentário' : 'Ocultar comentário'}>
                      <IconButton onClick={() => handleToggleHidden(comment)} aria-label="Alternar visibilidade">
                        {comment.hidden ? <Eye size={20} /> : <EyeOff size={20} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir comentário">
                      <IconButton
                        onClick={() => handleDelete(comment)}
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

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <IconButton size="small" color="inherit" aria-label="Fechar" onClick={() => setSnackbar('')}>
            <X size={18} />
          </IconButton>
        }
      />
    </Container>
  )
}
