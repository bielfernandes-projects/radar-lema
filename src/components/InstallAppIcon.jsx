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

export default function InstallAppIcon({ pulse = false }) {
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
          sx={{
            color: pulse ? 'primary.main' : undefined,
            '@media (prefers-reduced-motion: no-preference)': {
              '@keyframes installPulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.55)' },
                '70%': { boxShadow: '0 0 0 12px rgba(59, 130, 246, 0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
              },
              animation: pulse ? 'installPulse 2s ease-out infinite' : undefined
            }
          }}
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
