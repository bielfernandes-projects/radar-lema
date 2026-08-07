import { useState } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Button
} from '@mui/material'
import InstallIcon from '@mui/icons-material/Download'
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
      <IconButton
        aria-label="Instalar app"
        size="small"
        onClick={handleClick}
      >
        <InstallIcon />
      </IconButton>

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
