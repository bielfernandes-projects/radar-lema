import { IconButton, InputAdornment, Tooltip } from '@mui/material'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordToggle({ show, onToggle }) {
  return (
    <InputAdornment position="end">
      <Tooltip title={show ? 'Ocultar senha' : 'Mostrar senha'}>
        <IconButton
          onClick={onToggle}
          onMouseDown={(event) => event.preventDefault()}
          edge="end"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </IconButton>
      </Tooltip>
    </InputAdornment>
  )
}
