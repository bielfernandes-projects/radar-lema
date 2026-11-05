import { useCallback, useEffect, useState } from 'react'
import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Popover, Tooltip, Typography } from '@mui/material'
import { Bell } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyNotifications, markNotificationsRead } from '../services/notificationsData'
import { contentPath, formatHubDateTime } from '../utils/hub'

const POLL_MS = 60_000

const ACTION = { comment_like: 'curtiu seu comentário', comment_reply: 'respondeu ao seu comentário' }

// Sino do topo: curtidas e respostas nos comentarios do usuario. Sem tempo real: atualiza ao
// montar, a cada minuto (aba visivel) e ao abrir.
export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [anchor, setAnchor] = useState(null)
  // ids que estavam nao lidos quando o sino abriu: seguem destacados mesmo depois de marcados
  const [freshIds, setFreshIds] = useState(new Set())

  const load = useCallback(async () => {
    try {
      setItems(await fetchMyNotifications())
    } catch {
      // sino e secundario: falha silenciosa
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    load()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [user, load])

  if (!user) return null

  const unread = items.filter((n) => !n.read_at)

  const handleOpen = async (event) => {
    const target = event.currentTarget
    setFreshIds(new Set(unread.map((n) => n.id)))
    setAnchor(target)
    if (unread.length > 0) {
      try {
        await markNotificationsRead()
        setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      } catch {
        // continua nao lida; tenta de novo na proxima abertura
      }
    }
  }

  const handleSelect = (notification) => {
    setAnchor(null)
    navigate(contentPath(notification.content_type, notification.content_id))
  }

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          data-tour="sino"
          aria-label={unread.length > 0 ? `Notificações, ${unread.length} não lidas` : 'Notificações'}
          sx={{ p: 0.75 }}
        >
          <Badge color="error" badgeContent={unread.length} max={9}>
            <Bell size={22} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: { xs: 300, sm: 360 }, maxHeight: 420, overflowY: 'auto' }}>
          <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            Notificações
          </Typography>
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
              Nada por aqui ainda. Você será avisado quando curtirem ou responderem seus comentários.
            </Typography>
          ) : (
            <List dense disablePadding>
              {items.map((n) => (
                <ListItemButton
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  selected={freshIds.has(n.id)}
                  sx={{ alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={`${n.actor_name || 'Alguém'} ${ACTION[n.kind] ?? 'interagiu com seu comentário'}`}
                    secondary={
                      <>
                        {n.snippet && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                            “{n.snippet}”
                          </Typography>
                        )}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatHubDateTime(n.created_at)}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  )
}
