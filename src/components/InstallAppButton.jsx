import { useState } from 'react'
import { Alert, Button, Stack } from '@mui/material'
import { Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

const IOS_HELP =
  'No iPhone/iPad, toque no botao de compartilhar (o retangulo com uma flecha no menu do navegador) e depois em "Adicionar a Tela de Inicio".'
const FALLBACK_HELP =
  'Para instalar o app, use o menu do seu navegador e escolha "Instalar aplicativo" (desktop) ou "Adicionar a Tela de Inicio" (Android).'

export default function InstallAppButton() {
  const { install, canPrompt, isInstalled, isIOS } = usePWAInstall()
  const [help, setHelp] = useState('')

  if (isInstalled) return null

  const handleClick = async () => {
    if (canPrompt) {
      await install()
      return
    }
    setHelp(isIOS ? IOS_HELP : FALLBACK_HELP)
  }

  return (
    <Stack spacing={1}>
      <Button
        variant="contained"
        fullWidth
        size="large"
        color="inherit"
        startIcon={<Download size={20} />}
        onClick={handleClick}
      >
        Instalar App
      </Button>
      {help && <Alert severity="info">{help}</Alert>}
    </Stack>
  )
}