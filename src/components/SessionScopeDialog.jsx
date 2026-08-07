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
    description: 'Altera apenas a sessão editada.'
  },
  {
    value: 'following',
    label: 'Esta e próximas',
    description: 'Aplica o mesmo ajuste de horário desta sessão para ela e as seguintes.'
  },
  {
    value: 'all',
    label: 'Todas',
    description: 'Aplica o mesmo ajuste de horário para todas as sessões do evento.'
  }
]

export default function SessionScopeDialog({ open, onClose, onConfirm, getScopeCount }) {
  const [scope, setScope] = useState('single')

  const count = (value) => {
    if (typeof getScopeCount !== 'function') return null
    return getScopeCount(value)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aplicar alteração de sessão</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Este evento é recorrente. Como deseja aplicar a alteração de horário?
        </DialogContentText>
        <FormControl fullWidth>
          <RadioGroup
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            {SCOPE_OPTIONS.map((option) => {
              const affected = count(option.value)
              return (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                        {affected > 0 && ` Aplica a ${affected} ${affected === 1 ? 'sessão' : 'sessões'}.`}
                      </Typography>
                    </Box>
                  }
                />
              )
            })}
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
