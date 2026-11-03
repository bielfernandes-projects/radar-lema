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
import { ArrowBendUpLeft, ChatCircle, CircleNotch, Heart, PaperPlaneTilt, Trash } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { formatHubDateTime } from '../utils/hub'
import {
  fetchLikeStatus,
  toggleLike,
  fetchComments,
  addComment,
  deleteComment,
  fetchCommentLikes,
  toggleCommentLike
} from '../services/interactionsData'
import { groupComments } from '../utils/comments'

const NO_LIKES = { count: 0, liked: false }

// Um comentario (raiz ou resposta): texto, curtir, responder e, se for do usuario, excluir.
function CommentItem({ comment, user, like, onLike, onReply, onDelete }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
        {(comment.profiles?.name || 'U').slice(0, 1).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">{comment.profiles?.name || 'Usuário'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatHubDateTime(comment.created_at)}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
          {comment.body}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Button
            size="small"
            color={like.liked ? 'error' : 'inherit'}
            disabled={!user}
            onClick={() => onLike(comment.id)}
            aria-label="Curtir comentário"
            aria-pressed={like.liked}
            startIcon={<Heart size={16} weight={like.liked ? 'fill' : 'regular'} />}
            sx={{ minWidth: 0, textTransform: 'none' }}
          >
            {like.count > 0 ? like.count : 'Curtir'}
          </Button>
          <Button
            size="small"
            color="inherit"
            disabled={!user}
            onClick={() => onReply(comment)}
            startIcon={<ArrowBendUpLeft size={16} />}
            sx={{ minWidth: 0, textTransform: 'none' }}
          >
            Responder
          </Button>
        </Stack>
      </Box>
      {user?.id === comment.user_id && (
        <Tooltip title="Excluir comentário">
          <IconButton size="small" color="error" onClick={() => onDelete(comment.id)} aria-label="Excluir comentário">
            <Trash size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}

export default function Interactions({ contentType, contentId }) {
  const { user, profile } = useAuth()
  const [likeStatus, setLikeStatus] = useState({ liked: false, count: 0 })
  const [comments, setComments] = useState([])
  const [commentLikes, setCommentLikes] = useState(new Map())
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState(null) // comentario que esta sendo respondido
  const [replyBody, setReplyBody] = useState('')
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
        setCommentLikes(await fetchCommentLikes(items.map((c) => c.id), user?.id))
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

  // O comentario recem-criado ainda nao traz o nome do autor: usa o do perfil logado.
  const withAuthor = (created) => ({ ...created, profiles: { name: profile?.name ?? null } })

  const handleSubmitComment = async (event) => {
    event.preventDefault()
    if (!user || !body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const created = await addComment(contentType, contentId, user.id, body.trim())
      setComments((prev) => [...prev, withAuthor(created)])
      setBody('')
    } catch {
      setError('Erro ao publicar comentário.')
    }
    setSubmitting(false)
  }

  const closeReply = () => {
    setReplyTo(null)
    setReplyBody('')
  }

  const handleSubmitReply = async (event) => {
    event.preventDefault()
    if (!user || !replyTo || !replyBody.trim()) return
    setSubmitting(true)
    setError('')
    try {
      // Responder a uma resposta fica no mesmo nivel: o banco achata para o comentario raiz.
      const created = await addComment(contentType, contentId, user.id, replyBody.trim(), { parentId: replyTo.id })
      setComments((prev) => [...prev, withAuthor(created)])
      closeReply()
    } catch {
      setError('Erro ao publicar resposta.')
    }
    setSubmitting(false)
  }

  const handleLikeComment = async (commentId) => {
    if (!user) return
    const current = commentLikes.get(commentId) ?? NO_LIKES
    const next = { liked: !current.liked, count: Math.max(0, current.count + (current.liked ? -1 : 1)) }
    setCommentLikes((prev) => new Map(prev).set(commentId, next)) // otimista
    try {
      await toggleCommentLike(commentId, user.id, current.liked)
    } catch {
      setCommentLikes((prev) => new Map(prev).set(commentId, current))
      setError('Erro ao curtir o comentário.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    setError('')
    try {
      await deleteComment(commentId)
      // as respostas somem junto (ON DELETE CASCADE no banco)
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId))
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
          aria-pressed={Boolean(likeStatus.liked)}
          color={likeStatus.liked ? 'error' : 'default'}
        >
          {liking ? <CircleNotch size={22} /> : <Heart size={22} weight={likeStatus.liked ? 'fill' : 'regular'} />}
        </IconButton>
        <Typography variant="body1" color="text.secondary">
          {likeStatus.count} {likeStatus.count === 1 ? 'curtida' : 'curtidas'}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ChatCircle size={18} />
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
            startIcon={submitting ? <CircleNotch size={16} /> : <PaperPlaneTilt size={16} />}
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
        {groupComments(comments).map((comment) => {
          const replyingHere = replyTo && (replyTo.id === comment.id || comment.replies.some((r) => r.id === replyTo.id))
          return (
            <Box key={comment.id}>
              <CommentItem
                comment={comment}
                user={user}
                like={commentLikes.get(comment.id) ?? NO_LIKES}
                onLike={handleLikeComment}
                onReply={setReplyTo}
                onDelete={handleDeleteComment}
              />
              {(comment.replies.length > 0 || replyingHere) && (
                <Stack spacing={1.5} sx={{ mt: 1.5, ml: { xs: 2, sm: 5 }, pl: 1.5, borderLeft: 2, borderColor: 'divider' }}>
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      user={user}
                      like={commentLikes.get(reply.id) ?? NO_LIKES}
                      onLike={handleLikeComment}
                      onReply={setReplyTo}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                  {replyingHere && (
                    <Box component="form" onSubmit={handleSubmitReply} noValidate>
                      <Typography variant="caption" color="text.secondary">
                        Respondendo a {replyTo.profiles?.name || 'Usuário'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 0.5 }}>
                        <TextField
                          label="Sua resposta"
                          fullWidth
                          multiline
                          minRows={2}
                          maxRows={5}
                          size="small"
                          autoFocus
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          disabled={submitting}
                        />
                        <Stack spacing={0.5}>
                          <Button type="submit" variant="contained" size="small" disabled={!replyBody.trim() || submitting}>
                            Enviar
                          </Button>
                          <Button size="small" color="inherit" onClick={closeReply}>
                            Cancelar
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}
