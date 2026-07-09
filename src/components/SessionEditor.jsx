import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

function emptySession() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    start_date: today,
    start_time: '09:00',
    end_date: today,
    end_time: '10:00'
  }
}

export default function SessionEditor({ sessions = [], onChange }) {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(`${a.start_date}T${a.start_time}`).getTime() -
      new Date(`${b.start_date}T${b.start_time}`).getTime()
  )

  const updateSession = (index, field, value) => {
    const next = [...sorted]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  const removeSession = (index) => {
    const next = sorted.filter((_, i) => i !== index)
    onChange(next)
  }

  const addSession = () => {
    onChange([...sorted, emptySession()])
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Sessoes
      </Typography>

      {sorted.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Nenhuma sessao adicionada.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {sorted.map((session, index) => (
          <Paper key={session.id || index} variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Data inicio"
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
                  label="Hora inicio"
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
                <IconButton
                  onClick={() => removeSession(index)}
                  color="error"
                  aria-label="Remover sessao"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>

      <Button variant="outlined" onClick={addSession}>
        Adicionar sessao
      </Button>
    </Box>
  )
}
