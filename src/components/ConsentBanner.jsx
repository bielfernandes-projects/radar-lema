import { useState } from 'react'
import { Box, Button, Link as MuiLink, Paper, Typography } from '@mui/material'
import { getConsent, setConsent } from '../lib/posthog'

// Aviso de coleta de uso (PostHog). Sem escolha, nada é coletado.
export default function ConsentBanner() {
  const [choice, setChoice] = useState(getConsent)

  if (choice) return null

  const decide = (granted) => {
    setConsent(granted)
    setChoice(granted ? 'granted' : 'denied')
  }

  return (
    <Paper
      elevation={6}
      role="region"
      aria-label="Aviso de coleta de uso"
      sx={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.snackbar,
        maxWidth: 560,
        mx: 'auto',
        p: 2
      }}
    >
      <Typography variant="body2">
        Usamos dados de navegação anônimos para melhorar o RPPapp. Saiba mais na{' '}
        <MuiLink href="/privacidade">Política de Privacidade</MuiLink>.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
        <Button size="small" onClick={() => decide(false)}>
          Recusar
        </Button>
        <Button size="small" variant="contained" onClick={() => decide(true)}>
          Aceitar
        </Button>
      </Box>
    </Paper>
  )
}
