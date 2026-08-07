import { useState } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import { Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

const IOS_HELP =
  'No iPhone/iPad, toque no botao de compartilhar (o retangulo com uma flecha no menu do navegador) e depois em "Adicionar a Tela de Inicio".'
const FALLBACK_HELP =
  'Para instalar o app, use o menu do seu navegador e escolha "Instalar aplicativo" (desktop) ou "Adicionar a Tela de Inicio" (Android).'

export default function InstallAppIcon() {
  const { install, canPrompt, isInstalled, isIOS } = usePWAInstall()
  const [open, setOpen] = useState(false)

  if (isInstalled) return null

  const handleClick = async () => {
    if (canPrompt) {
      await install()
      return
    }
    setOpen(true)
  }

  return (
    <>
      <Tooltip title="Instalar app">
        <IconButton
          aria-label="Instalar app"
          size="small"
          onClick={handleClick}
        >
          <Download size={20} />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Instalar App</DialogTitle>
        <DialogContent>
          <DialogContentText>{isIOS ? IOS_HELP : FALLBACK_HELP}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
