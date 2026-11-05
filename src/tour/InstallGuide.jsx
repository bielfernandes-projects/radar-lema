import { Box, Button, Stack, Typography } from '@mui/material'
import { usePWAInstall } from '../hooks/usePWAInstall'

const RING = '#d32f2f'

// Desenhos simples em SVG (nao prints): nao envelhecem com as versoes do iOS/Android.
function IOSBarMock() {
  return (
    <svg role="img" aria-label="Barra do Safari com o botão de compartilhar circulado" viewBox="0 0 240 64" width="100%" style={{ maxWidth: 300 }}>
      <rect x="4" y="12" width="232" height="44" rx="14" fill="#e6ebf2" />
      <text x="30" y="42" textAnchor="middle" fontSize="20" fill="#5b6575">‹</text>
      <text x="75" y="42" textAnchor="middle" fontSize="20" fill="#5b6575">›</text>
      {/* quadrado com seta para cima = compartilhar */}
      <rect x="110" y="30" width="20" height="16" rx="3" fill="none" stroke="#1565c0" strokeWidth="2.5" />
      <path d="M120 36 V16 M113 23 L120 16 L127 23" fill="none" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="32" r="22" fill="none" stroke={RING} strokeWidth="3" />
      <rect x="157" y="26" width="16" height="14" rx="2" fill="none" stroke="#5b6575" strokeWidth="2" />
      <rect x="200" y="26" width="14" height="14" rx="2" fill="none" stroke="#5b6575" strokeWidth="2" />
    </svg>
  )
}

function AndroidBarMock() {
  return (
    <svg role="img" aria-label="Barra do navegador com os três pontinhos circulados" viewBox="0 0 240 56" width="100%" style={{ maxWidth: 300 }}>
      <rect x="4" y="8" width="232" height="40" rx="10" fill="#e6ebf2" />
      <rect x="14" y="17" width="150" height="22" rx="11" fill="#ffffff" />
      <circle cx="208" cy="20" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="28" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="36" r="2.8" fill="#1565c0" />
      <circle cx="208" cy="28" r="19" fill="none" stroke={RING} strokeWidth="3" />
    </svg>
  )
}

function Step({ n, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700
        }}
      >
        {n}
      </Box>
      <Typography sx={{ fontSize: 18, lineHeight: 1.45 }}>{children}</Typography>
    </Stack>
  )
}

export default function InstallGuide() {
  const { install, canPrompt, isInstalled, isIOS } = usePWAInstall()

  if (isInstalled) {
    return <Typography sx={{ fontSize: 18 }}>Pronto! O RPPApp já está na sua tela inicial.</Typography>
  }

  if (canPrompt) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ fontSize: 18 }}>
          Tenha o RPPApp na tela inicial do celular, como um aplicativo. Toque no botão e confirme.
        </Typography>
        <Button variant="contained" size="large" onClick={install} sx={{ minHeight: 56, fontSize: 18 }}>
          Instalar agora
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {isIOS ? <IOSBarMock /> : <AndroidBarMock />}
      {isIOS ? (
        <>
          <Step n={1}>Toque no botão de compartilhar (o quadrado com uma seta para cima), na barra de baixo do Safari.</Step>
          <Step n={2}>Role a lista e toque em “Adicionar à Tela de Início”.</Step>
          <Step n={3}>Toque em “Adicionar”. O ícone do RPPApp aparece na sua tela.</Step>
        </>
      ) : (
        <>
          <Step n={1}>Toque nos três pontinhos (⋮), no canto de cima do navegador.</Step>
          <Step n={2}>Toque em “Instalar aplicativo” ou “Adicionar à tela inicial”.</Step>
          <Step n={3}>Confirme. O ícone do RPPApp aparece na sua tela.</Step>
        </>
      )}
    </Stack>
  )
}
