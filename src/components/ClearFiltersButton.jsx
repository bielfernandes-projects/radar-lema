import { Button } from '@mui/material'
import { FunnelX } from '@phosphor-icons/react'

export default function ClearFiltersButton({ disabled, onClick }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outlined"
      size="small"
      startIcon={<FunnelX size={16} />}
      sx={{ fontSize: '0.75rem', px: 1.25, minWidth: 'auto', whiteSpace: 'nowrap' }}
    >
      Limpar Filtros
    </Button>
  )
}
