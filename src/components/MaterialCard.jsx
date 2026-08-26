import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { Download, FileText, Loader2, Eye, X } from 'lucide-react'
import { getMaterialUrl } from '../services/materialsData'
import { formatFileSize, formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import { useAuth } from '../contexts/AuthContext'
import { canAccessLemaExclusive } from '../utils/auth'
import {
  CARD_HEIGHT_MATERIAL,
  TRUNCATE,
  cardBodySx,
  cardContentSx,
  cardFooterSlotSx,
  cardMetaStackSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'
import ExclusiveBadge from './ExclusiveBadge'

export default function MaterialCard({ material }) {
  const { profile } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const isExclusive = material.visibility === 'lema_client'
  const locked = isExclusive && !canAccessLemaExclusive(profile)

  const sizeLabel = material.file_name
    ? formatFileSize(material.file_size)
    : material.file_type

  const isPdf =
    material.file_type === 'application/pdf' ||
    material.file_name?.toLowerCase().endsWith('.pdf')

  const description = material.description || ''
  const isTruncated = description.length > TRUNCATE.body2Lines
  const displayDescription = expanded
    ? description
    : truncateAtWord(description, TRUNCATE.body2Lines)

  const handleDownload = async () => {
    if (locked) return
    setDownloading(true)
    setError('')
    try {
      const url = await getMaterialUrl(material.storage_path, material.file_name)
      const link = document.createElement('a')
      link.href = url
      link.download = material.file_name || 'material'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      setError(err?.message || 'Não foi possível baixar o material.')
    }
    setDownloading(false)
  }

  const handleOpen = async () => {
    if (locked) return
    setLoadingPreview(true)
    setError('')
    try {
      const url = await getMaterialUrl(material.storage_path, material.file_name, { download: false })
      setPreviewUrl(url)
    } catch (err) {
      setError(err?.message || 'Não foi possível abrir o material.')
    }
    setLoadingPreview(false)
  }

  return (
    <Card sx={{ ...cardRootSx(CARD_HEIGHT_MATERIAL), opacity: locked ? 0.7 : 1 }}>
      <CardContent sx={cardContentSx}>
        <Stack direction="column" spacing={0.5} sx={cardMetaStackSx}>
          {isExclusive && <ExclusiveBadge compact />}
          <Chip label={formatHubDate(material.created_at)} size="small" variant="outlined" />
        </Stack>

        <Typography variant="h6" component="h2" sx={cardTitleSx()}>
          {truncateAtWord(material.title, TRUNCATE.title)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={expanded ? undefined : cardBodySx(2)}>
          {displayDescription}
          {isTruncated && (
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 600, ml: 0.5, whiteSpace: 'nowrap' }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'ver menos' : 'ver mais'}
            </Typography>
          )}
        </Typography>

        <Box sx={cardSpacerSx} />

        <Stack direction="row" alignItems="center" spacing={1} sx={cardFooterSlotSx}>
          <Tooltip title={locked ? 'Exclusivo para clientes Lema' : ''}>
            <span>
              {isPdf ? (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={loadingPreview ? <Loader2 size={16} /> : <Eye size={16} />}
                  onClick={handleOpen}
                  disabled={locked || loadingPreview}
                  sx={locked ? { cursor: 'not-allowed' } : undefined}
                >
                  Abrir
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={downloading ? <Loader2 size={16} /> : <Download size={16} />}
                  onClick={handleDownload}
                  disabled={locked || downloading}
                  sx={locked ? { cursor: 'not-allowed' } : undefined}
                >
                  {downloading ? 'Preparando...' : 'Baixar'}
                </Button>
              )}
            </span>
          </Tooltip>
          {sizeLabel && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', minWidth: 0 }}>
              <FileText size={14} style={{ flexShrink: 0 }} />
              <Typography variant="caption" noWrap>
                {sizeLabel}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} maxWidth="md" fullWidth>
        <DialogTitle>{material.title}</DialogTitle>
        <DialogContent sx={{ height: '75vh', p: 0 }}>
          {previewUrl && (
            <Box
              component="iframe"
              src={previewUrl}
              title={material.title}
              sx={{ width: '100%', height: '100%', border: 0 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Download size={16} />} onClick={handleDownload} disabled={downloading}>
            Baixar
          </Button>
          <Button onClick={() => setPreviewUrl(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* O erro vai para Snackbar, e nao para dentro do card: um Alert no corpo
          muda a altura do card e desalinha a linha inteira da grade. */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError('')}
        message={error}
        action={
          <IconButton size="small" color="inherit" aria-label="Fechar" onClick={() => setError('')}>
            <X size={18} />
          </IconButton>
        }
      />
    </Card>
  )
}
