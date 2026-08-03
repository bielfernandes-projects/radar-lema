import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useReminders } from '../hooks/useReminders'
import { REMINDER_UNITS, REMINDER_CHANNELS } from '../utils/constants'
import { formatReminder, formatReminderMinutes } from '../utils/formatters'

function unitLabel(unit, value, selected) {
  const base = value > 1 ? unit.plural : unit.label
  const capitalized = base.charAt(0).toUpperCase() + base.slice(1)
  return selected ? `${value} ${base} antes` : capitalized
}

export default function ReminderDialog({
  open,
  event,
  onClose,
  onSaved,
  initialEntries
}) {
  const { saveReminders } = useReminders()
  const [entries, setEntries] = useState([])
  const [draftValue, setDraftValue] = useState('1')
  const [draftUnit, setDraftUnit] = useState('hour')
  const [draftChannel, setDraftChannel] = useState('push')
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })

  useEffect(() => {
    if (open) {
      setEntries(initialEntries || [])
      setDraftValue('1')
      setDraftUnit('hour')
      setDraftChannel('push')
    }
  }, [open, initialEntries])

  const parsedValue = Math.max(1, Number(draftValue) || 1)

  const addEntry = () => {
    const exists = entries.some(
      (e) => e.value === parsedValue && e.unit === draftUnit && e.channel === draftChannel
    )
    if (exists) return
    setEntries((prev) => [
      ...prev,
      { value: parsedValue, unit: draftUnit, channel: draftChannel }
    ])
  }

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (entries.length === 0) return
    setSaving(true)

    const payload = entries.map((entry) => {
      const unit = REMINDER_UNITS.find((u) => u.value === entry.unit)
      return {
        offset_minutes: entry.value * unit.minutes,
        channel: entry.channel
      }
    })

    const { error } = await saveReminders(event.id, payload)
    setSaving(false)

    if (error) {
      setSnackbar({ open: true, message: 'Erro ao salvar lembrete.' })
      return
    }

    const label = payload
      .map((p) => formatReminderMinutes(p.offset_minutes, p.channel))
      .join(' e ')
    setSnackbar({
      open: true,
      message: `Lembrete salvo. Voce seria avisado ${label} antes do evento.`
    })
    onClose()
    if (onSaved) onSaved()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>
          Quer ser avisado antes deste evento?
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 1 }}>
            {event.title}
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Antecedência
              </Typography>
              <TextField
                type="number"
                inputProps={{ min: 1 }}
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                label="Quantidade"
                size="small"
                fullWidth
              />
            </Box>

            <RadioGroup
              value={draftUnit}
              onChange={(e) => setDraftUnit(e.target.value)}
            >
              <Stack spacing={0.5}>
                {REMINDER_UNITS.map((unit) => (
                  <FormControlLabel
                    key={unit.value}
                    value={unit.value}
                    control={<Radio size="small" />}
                    label={unitLabel(unit, parsedValue, draftUnit === unit.value)}
                  />
                ))}
              </Stack>
            </RadioGroup>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Como avisar
              </Typography>
              <RadioGroup
                row
                value={draftChannel}
                onChange={(e) => setDraftChannel(e.target.value)}
              >
                {REMINDER_CHANNELS.map((channel) => (
                  <FormControlLabel
                    key={channel.value}
                    value={channel.value}
                    control={<Radio size="small" />}
                    label={channel.label}
                  />
                ))}
              </RadioGroup>
            </Box>

            <Button
              variant="outlined"
              onClick={addEntry}
              disabled={!draftValue || Number(draftValue) < 1}
              sx={{ alignSelf: 'flex-start' }}
            >
              Adicionar
            </Button>

            {entries.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {entries.map((entry, index) => (
                  <Chip
                    key={`${entry.value}-${entry.unit}-${entry.channel}-${index}`}
                    label={formatReminder(entry.value, entry.unit, entry.channel)}
                    onDelete={() => removeEntry(index)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="secondary">
            Agora nao
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={entries.length === 0 || saving}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </>
  )
}
