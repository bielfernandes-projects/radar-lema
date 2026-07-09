import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Snackbar,
  Typography
} from '@mui/material'
import { useReminders } from '../hooks/useReminders'
import { OFFSET_LABELS, OFFSET_ORDER } from '../utils/constants'

function formatOffsets(offsets) {
  const labels = offsets
    .slice()
    .sort((a, b) => b - a)
    .map((o) => OFFSET_LABELS[o])
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return labels.join(' e ')
  const first = labels.slice(0, -1).join(', ')
  return `${first} e ${labels[labels.length - 1]}`
}

export default function ReminderDialog({
  open,
  event,
  onClose,
  onSaved,
  initialOffsets
}) {
  const { saveReminders } = useReminders()
  const [selected, setSelected] = useState(initialOffsets || [])
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '' })

  useEffect(() => {
    if (open) {
      setSelected(initialOffsets || [])
    }
  }, [open, initialOffsets])

  const handleToggle = (offset) => {
    setSelected((prev) =>
      prev.includes(offset)
        ? prev.filter((o) => o !== offset)
        : [...prev, offset]
    )
  }

  const handleSave = async () => {
    if (selected.length === 0) return
    setSaving(true)
    const { error } = await saveReminders(event.id, selected)
    setSaving(false)

    if (error) {
      setSnackbar({ open: true, message: 'Erro ao salvar lembrete.' })
      return
    }

    const label = formatOffsets(selected)
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

          {OFFSET_ORDER.map((offset) => (
            <FormControlLabel
              key={offset}
              control={
                <Checkbox
                  checked={selected.includes(offset)}
                  onChange={() => handleToggle(offset)}
                />
              }
              label={OFFSET_LABELS[offset]}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="secondary">
            Agora nao
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={selected.length === 0 || saving}
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
