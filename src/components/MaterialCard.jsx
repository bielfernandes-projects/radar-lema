import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography
} from '@mui/material'
import { Download, FileText, Loader2 } from 'lucide-react'
import { getMaterialUrl } from '../services/materialsData'
import { formatFileSize, formatHubDate } from '../utils/hub'
import ExclusiveBadge from './ExclusiveBadge'

export default function MaterialCard({ material }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setDownloading(true)
    setError('')
    try {
      const url = await getMaterialUrl(material.storage_path)
      const link = document.createElement('a')
      link.href = url
      link.download = material.file_name || 'material'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      setError('Não foi possível baixar o material.')
    }
    setDownloading(false)
  }

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          {material.visibility === 'lema_client' && <ExclusiveBadge />}
          <Chip label={formatHubDate(material.created_at)} size="small" variant="outlined" />
          {material.file_type && (
            <Chip
              icon={<FileText size={14} />}
              label={material.file_name ? formatFileSize(material.file_size) : material.file_type}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
          {material.title}
        </Typography>
        {material.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {material.description}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        <Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={downloading ? <Loader2 size={16} /> : <Download size={16} />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Preparando...' : 'Baixar material'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
