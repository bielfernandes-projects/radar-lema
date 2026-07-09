import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material'

const SCOPE_OPTIONS = [
  {
    value: 'single',
    label: 'Só esta',
    description: 'Altera apenas a sessao editada.'
  },
  {
    value: 'following',
    label: 'Este e próximos',
    description: 'Aplica o mesmo ajuste de horario desta sessao para ela e as seguintes.'
  },
  {
    value: 'all',
    label: 'Todos',
    description: 'Aplica o mesmo ajuste de horario para todas as sessoes do evento.'
  }
]

export default function SessionScopeDialog({ open, onClose, onConfirm }) {
  const [scope, setScope] = useState('single')

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aplicar alteracao de sessao</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Este evento e recorrente. Como deseja aplicar a alteracao de horario?
        </DialogContentText>
        <FormControl fullWidth>
          <RadioGroup
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            {SCOPE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onConfirm(scope)} variant="contained">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
