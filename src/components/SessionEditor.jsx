import { useState } from 'react'
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { emptySession } from '../utils/eventForm'

const VISIBLE_LIMIT = 6

export default function SessionEditor({ sessions = [], onChange }) {
  const [showAll, setShowAll] = useState(false)

  const updateSession = (index, field, value) => {
    const next = [...sessions]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  const removeSession = (index) => {
    const next = sessions.filter((_, i) => i !== index)
    onChange(next)
  }

  const addSession = () => {
    onChange([...sessions, emptySession()])
  }

  const collapsed = sessions.length > VISIBLE_LIMIT
  const visibleSessions = collapsed && !showAll
    ? sessions.slice(0, VISIBLE_LIMIT)
    : sessions

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Sessões
      </Typography>

      {sessions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Nenhuma sessão adicionada.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {visibleSessions.map((session, index) => (
          <Paper key={session.id || index} variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Data início"
                  type="date"
                  fullWidth
                  size="small"
                  value={session.start_date || ''}
                  onChange={(e) => updateSession(index, 'start_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  label="Hora início"
                  type="time"
                  fullWidth
                  size="small"
                  value={session.start_time?.slice(0, 5) || ''}
                  onChange={(e) => updateSession(index, 'start_time', `${e.target.value}:00`)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Data fim"
                  type="date"
                  fullWidth
                  size="small"
                  value={session.end_date || ''}
                  onChange={(e) => updateSession(index, 'end_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField
                  label="Hora fim"
                  type="time"
                  fullWidth
                  size="small"
                  value={session.end_time?.slice(0, 5) || ''}
                  onChange={(e) => updateSession(index, 'end_time', `${e.target.value}:00`)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'right' }}>
                <Tooltip title="Remover sessão">
                  <IconButton
                    onClick={() => removeSession(index)}
                    color="error"
                    aria-label="Remover sessão"
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>

      {collapsed && (
        <Button
          variant="text"
          size="small"
          onClick={() => setShowAll((prev) => !prev)}
          endIcon={showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          sx={{ mb: 1 }}
        >
          {showAll
            ? 'Mostrar menos'
            : `Mostrar todas as ${sessions.length} sessões`}
        </Button>
      )}

      <Button variant="outlined" onClick={addSession}>
        Adicionar sessão
      </Button>
    </Box>
  )
}
