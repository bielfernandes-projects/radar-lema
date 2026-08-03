import { Button } from '@mui/material'
import ClearAllIcon from '@mui/icons-material/ClearAll'

export default function ClearFiltersButton({ disabled, onClick }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outlined"
      size="small"
      startIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
      sx={{ fontSize: '0.75rem', px: 1.25, minWidth: 'auto', whiteSpace: 'nowrap' }}
    >
      Limpar Filtros
    </Button>
  )
}
