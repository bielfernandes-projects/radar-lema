import { Chip } from '@mui/material'
import { Lock } from 'lucide-react'

/**
 * `compact` encurta o rotulo para o uso em card: "Exclusivo Cliente Lema" ao
 * lado do chip de data estoura a largura de um card de grade e quebra o chip
 * para uma segunda linha, o que desalinha o miolo do card. O nome curto e o
 * que o PRODUCT.md ja usa ao descrever o badge.
 */
export default function ExclusiveBadge({ size = 'small', compact = false }) {
  return (
    <Chip
      size={size}
      icon={<Lock size={14} />}
      label={compact ? 'Exclusivo Lema' : 'Exclusivo Cliente Lema'}
      color="secondary"
      variant="filled"
    />
  )
}
