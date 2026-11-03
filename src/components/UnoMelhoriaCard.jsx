import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import { formatHubDate } from '../utils/hub'
import { truncateAtWord } from '../utils/text'
import {
  CARD_HEIGHT_UNO_UPDATE,
  TRUNCATE,
  cardActionAreaSx,
  cardBodySx,
  cardContentSx,
  cardMetaStackSx,
  cardRootSx,
  cardSpacerSx,
  cardTitleSx
} from '../theme/cardLayout'

// Melhoria/funcionalidade publicada no sininho do UNO (rota melhoriasUNO).
// Nao tem pagina de detalhe: o clique abre um dialogo com o texto completo.
export default function UnoMelhoriaCard({ melhoria }) {
  const [open, setOpen] = useState(false)
  const typeChip = (
    <Chip
      label={melhoria.improvement_type}
      size="small"
      sx={{ bgcolor: melhoria.improvement_type_color, color: '#fff', fontWeight: 600 }}
    />
  )
  // So links http(s): o texto vem de fora do app.
  const video = /^https?:\/\//i.test(melhoria.video_url || '') ? melhoria.video_url : null

  return (
    <>
      <Card sx={cardRootSx(CARD_HEIGHT_UNO_UPDATE)}>
        <CardActionArea onClick={() => setOpen(true)} sx={cardActionAreaSx}>
          <CardContent sx={cardContentSx}>
            <Stack direction="column" spacing={0.5} sx={cardMetaStackSx}>
              {typeChip}
              <Chip label={formatHubDate(melhoria.improvement_date)} size="small" variant="outlined" />
            </Stack>
            <Typography variant="h6" component="h2" sx={cardTitleSx()}>
              {truncateAtWord(melhoria.improvement_title, TRUNCATE.title)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={cardBodySx(4)}>
              {truncateAtWord(melhoria.improvement_description, TRUNCATE.body4Lines)}
            </Typography>
            <Box sx={cardSpacerSx} />
          </CardContent>
        </CardActionArea>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{melhoria.improvement_title}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {typeChip}
            <Chip label={formatHubDate(melhoria.improvement_date)} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {melhoria.improvement_description}
          </Typography>
        </DialogContent>
        <DialogActions>
          {video && (
            <Button href={video} target="_blank" rel="noopener noreferrer">
              Assistir ao vídeo
            </Button>
          )}
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
