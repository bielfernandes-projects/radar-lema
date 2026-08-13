import { Chip } from '@mui/material'
import { Lock } from 'lucide-react'

export default function ExclusiveBadge({ size = 'small' }) {
  return (
    <Chip
      size={size}
      icon={<Lock size={14} />}
      label="Exclusivo Cliente Lema"
      color="secondary"
      variant="filled"
    />
  )
}
