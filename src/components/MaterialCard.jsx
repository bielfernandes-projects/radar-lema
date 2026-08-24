import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Typography
} from '@mui/material'
import { Download, FileText, Loader2, X } from 'lucide-react'
import { getMaterialUrl } from '../services/materialsData'
import { formatFileSize, formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_TEXT_ONLY,
  TRUNCATE,
  cardBodySx,
  cardContentSx,
  cardFooterSlotSx,
  cardMetaSlotSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'
import ExclusiveBadge from './ExclusiveBadge'

export default function MaterialCard({ material }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const sizeLabel = material.file_name
    ? formatFileSize(material.file_size)
    : material.file_type

  const handleDownload = async () => {
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

  return (
    <Card sx={cardRootSx(CARD_HEIGHT_TEXT_ONLY)}>
      <CardContent sx={cardContentSx}>
        <Stack direction="row" spacing={1} sx={cardMetaSlotSx}>
          {material.visibility === 'lema_client' && <ExclusiveBadge compact />}
          <Chip label={formatHubDate(material.created_at)} size="small" variant="outlined" />
        </Stack>

        <Typography variant="h6" component="h2" sx={cardTitleSx()}>
          {truncateAtWord(material.title, TRUNCATE.title)}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={cardBodySx(2)}>
          {truncateAtWord(material.description, TRUNCATE.body2Lines)}
        </Typography>

        <Box sx={cardSpacerSx} />

        {/* Tamanho do arquivo fica junto da acao de baixar, e nao na linha de
            chips: tres chips estouram a largura do card e quebram para uma
            segunda linha. */}
        <Stack direction="row" alignItems="center" spacing={1} sx={cardFooterSlotSx}>
          <Button
            size="small"
            variant="outlined"
            startIcon={downloading ? <Loader2 size={16} /> : <Download size={16} />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Preparando...' : 'Baixar'}
          </Button>
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
