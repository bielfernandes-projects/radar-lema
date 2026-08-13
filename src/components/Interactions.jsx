import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Heart, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { formatHubDateTime } from '../utils/hub'
import {
  fetchLikeStatus,
  toggleLike,
  fetchComments,
  addComment,
  deleteComment
} from '../services/interactionsData'

export default function Interactions({ contentType, contentId }) {
  const { user } = useAuth()
  const [likeStatus, setLikeStatus] = useState({ liked: false, count: 0 })
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [liking, setLiking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [status, items] = await Promise.all([
          fetchLikeStatus(contentType, contentId, user?.id),
          fetchComments(contentType, contentId)
        ])
        setLikeStatus(status)
        setComments(items)
      } catch {
        setError('Erro ao carregar interações.')
      }
    }
    fetchData()
  }, [contentType, contentId, user?.id])

  const handleToggleLike = async () => {
    if (!user) return
    setLiking(true)
    setError('')
    try {
      await toggleLike(contentType, contentId, user.id, likeStatus.liked)
      setLikeStatus((prev) => ({
        liked: !prev.liked,
        count: prev.count + (prev.liked ? -1 : 1)
      }))
    } catch {
      setError('Erro ao atualizar curtida.')
    }
    setLiking(false)
  }

  const handleSubmitComment = async (event) => {
    event.preventDefault()
    if (!user || !body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const created = await addComment(contentType, contentId, user.id, body.trim())
      setComments((prev) => [...prev, created])
      setBody('')
    } catch {
      setError('Erro ao publicar comentário.')
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    setError('')
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {
      setError('Erro ao excluir comentário.')
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mt: 4 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <IconButton
          onClick={handleToggleLike}
          disabled={!user || liking}
          aria-label="Curtir"
          color={likeStatus.liked ? 'error' : 'default'}
        >
          {liking ? <Loader2 size={22} /> : <Heart size={22} fill={likeStatus.liked ? 'currentColor' : 'none'} />}
        </IconButton>
        <Typography variant="body1" color="text.secondary">
          {likeStatus.count} {likeStatus.count === 1 ? 'curtida' : 'curtidas'}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <MessageCircle size={18} />
          <Typography variant="body1" color="text.secondary">
            {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
          </Typography>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Box component="form" onSubmit={handleSubmitComment} noValidate>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            label="Deixe seu comentário"
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!user || submitting}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!user || !body.trim() || submitting}
            startIcon={submitting ? <Loader2 size={16} /> : <Send size={16} />}
            sx={{ mt: 1 }}
          >
            Enviar
          </Button>
        </Stack>
      </Box>

      <Stack spacing={2} sx={{ mt: 2 }}>
        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Seja o primeiro a comentar.
          </Typography>
        )}
        {comments.map((comment) => (
          <Box key={comment.id}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                {(comment.profiles?.name || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">
                    {comment.profiles?.name || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatHubDateTime(comment.created_at)}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {comment.body}
                </Typography>
              </Box>
              {user?.id === comment.user_id && (
                <Tooltip title="Excluir comentário">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteComment(comment.id)}
                    aria-label="Excluir comentário"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
