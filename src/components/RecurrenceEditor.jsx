import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material'

const FREQUENCY_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' }
]

export default function RecurrenceEditor({
  isRecurring,
  frequency,
  untilDate,
  onChange
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Recorrência
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={isRecurring}
            onChange={(e) =>
              onChange({ isRecurring: e.target.checked, frequency, untilDate })
            }
          />
        }
        label="Evento recorrente"
      />

      {isRecurring && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 160 }} size="small">
            <InputLabel id="frequency-label">Frequencia</InputLabel>
            <Select
              labelId="frequency-label"
              value={frequency || ''}
              label="Frequencia"
              onChange={(e) =>
                onChange({ isRecurring, frequency: e.target.value, untilDate })
              }
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Ate"
            type="date"
            size="small"
            value={untilDate || ''}
            onChange={(e) =>
              onChange({ isRecurring, frequency, untilDate: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}
    </Box>
  )
}
